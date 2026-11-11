'use server'

import { requireAdmin } from '@/lib/auth-guard'

interface TranslateProductContentInput {
  shortDescription?: string | null
  description?: string | null
  careGuide?: string | null
}

interface TranslateProductContentResult {
  shortDescriptionEn: string
  descriptionEn: string
  careGuideEn: string
}

export async function translateProductContentAction(
  input: TranslateProductContentInput
): Promise<{ success: boolean; data?: TranslateProductContentResult; error?: string }> {
  try {
    await requireAdmin()

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      return {
        success: false,
        error:
          'GEMINI_API_KEY belum dikonfigurasi di server environment (.env.local). Silakan tambahkan GEMINI_API_KEY terlebih dahulu.',
      }
    }

    const shortDesc = input.shortDescription?.trim() || ''
    const desc = input.description?.trim() || ''
    const care = input.careGuide?.trim() || ''

    if (!shortDesc && !desc && !care) {
      return {
        success: false,
        error: 'Tidak ada teks yang perlu diterjemahkan. Harap isi teks Bahasa Indonesia terlebih dahulu.',
      }
    }

    const systemInstruction = `
You are an expert bilingual copywriter and translator specializing in modest fashion and apparel for the Malaysian market (English / Malaysian English).
Translate Indonesian product descriptions into high-converting, elegant, and natural English.
Use industry-standard modest fashion terminology:
- "busui friendly" -> "nursing-friendly"
- "wudhu friendly" -> "wudhu-friendly"
- "bahan adem / sejuk" -> "breathable and cooling fabric"
- "tidak mudah kusut" -> "ironless / wrinkle-resistant"
- "jatuh / flowy" -> "gracefully flowy"
- Keep sizing notes, bullet points, and formatting structure intact.

Always return a strictly valid JSON object with exactly these 3 keys:
{
  "shortDescriptionEn": "translated short description",
  "descriptionEn": "translated full description",
  "careGuideEn": "translated care guide"
}
Do not wrap in markdown quotes or code fences outside the JSON. Return only the raw JSON.
`.trim()

    const userPrompt = JSON.stringify({
      shortDescription: shortDesc,
      description: desc,
      careGuide: care,
    })

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nTranslate the following Indonesian apparel data into English:\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API translation error:', response.status, errText)
      return {
        success: false,
        error: `Gagal menghubungi layanan terjemahan (Gemini API HTTP ${response.status}).`,
      }
    }

    const resJson = await response.json()
    const rawOutput = resJson?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawOutput) {
      return {
        success: false,
        error: 'Tidak ada respons yang diterima dari model terjemahan.',
      }
    }

    let parsed: any
    try {
      parsed = JSON.parse(rawOutput)
    } catch {
      // Fallback cleanup if model added backticks
      const cleaned = rawOutput.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    }

    return {
      success: true,
      data: {
        shortDescriptionEn: typeof parsed.shortDescriptionEn === 'string' ? parsed.shortDescriptionEn : '',
        descriptionEn: typeof parsed.descriptionEn === 'string' ? parsed.descriptionEn : '',
        careGuideEn: typeof parsed.careGuideEn === 'string' ? parsed.careGuideEn : '',
      },
    }
  } catch (err: unknown) {
    console.error('Error in translateProductContentAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kesalahan saat menerjemahkan.',
    }
  }
}

export async function bulkTranslateEmptyProductsAction(batchSize = 5): Promise<{
  success: boolean
  data?: { translatedCount: number; remainingCount: number }
  error?: string
}> {
  try {
    await requireAdmin()

    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()

    const { data: candidates, error: fetchErr } = await supabase
      .from('products')
      .select('id, name, short_description, description, care_guide, short_description_en, description_en, care_guide_en')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchErr) throw fetchErr

    const needsTranslation = (candidates || []).filter((p) => {
      const missingShort = Boolean(p.short_description?.trim()) && !p.short_description_en?.trim()
      const missingDesc = Boolean(p.description?.trim()) && !p.description_en?.trim()
      const missingCare = Boolean(p.care_guide?.trim()) && !p.care_guide_en?.trim()
      return missingShort || missingDesc || missingCare
    })

    if (needsTranslation.length === 0) {
      return {
        success: true,
        data: { translatedCount: 0, remainingCount: 0 },
      }
    }

    const batch = needsTranslation.slice(0, batchSize)
    let translatedCount = 0

    for (const prod of batch) {
      const res = await translateProductContentAction({
        shortDescription: !prod.short_description_en?.trim() ? prod.short_description : '',
        description: !prod.description_en?.trim() ? prod.description : '',
        careGuide: !prod.care_guide_en?.trim() ? prod.care_guide : '',
      })

      if (!res.success || !res.data) {
        if (res.error?.includes('GEMINI_API_KEY')) {
          return { success: false, error: res.error }
        }
        continue
      }

      const updates: Record<string, string> = {}
      if (!prod.short_description_en?.trim() && res.data.shortDescriptionEn.trim()) {
        updates.short_description_en = res.data.shortDescriptionEn.trim()
      }
      if (!prod.description_en?.trim() && res.data.descriptionEn.trim()) {
        updates.description_en = res.data.descriptionEn.trim()
      }
      if (!prod.care_guide_en?.trim() && res.data.careGuideEn.trim()) {
        updates.care_guide_en = res.data.careGuideEn.trim()
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', prod.id)

        if (!updateErr) {
          translatedCount++
        }
      }
    }

    return {
      success: true,
      data: {
        translatedCount,
        remainingCount: Math.max(0, needsTranslation.length - translatedCount),
      },
    }
  } catch (err: unknown) {
    console.error('Error in bulkTranslateEmptyProductsAction:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Gagal menjalankan bulk translate.',
    }
  }
}


