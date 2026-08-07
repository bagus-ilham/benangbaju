import { useQuery } from '@tanstack/react-query'
import { getSiteSettingsAction } from '@/modules/settings/actions'
import { SOCIAL_LINKS } from '@/lib/constants'

export function useSiteSettings() {
  const query = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getSiteSettingsAction(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const settings = query.data?.data || []

  const getSetting = (keys: string[]) => settings.find((s) => keys.includes(s.key))

  const logoSetting = getSetting(['store_logo_url'])
  const rawLogo = logoSetting?.value?.trim()
  const logoUrl =
    rawLogo && rawLogo !== '/logo.PNG' && rawLogo !== '/images/placeholder.jpg'
      ? rawLogo
      : '/image/svg/logo/logo-benangbaju.svg'


  const getSocialUrl = (
    settingValue: string | undefined,
    platform: keyof typeof SOCIAL_LINKS,
    prefix: string
  ) => {
    if (!settingValue) return SOCIAL_LINKS[platform]
    return settingValue.startsWith('http') ? settingValue : `${prefix}${settingValue}`
  }

  const instagramSetting = getSetting(['social_instagram', 'instagram_username'])
  const instagramUrl = getSocialUrl(instagramSetting?.value, 'instagram', 'https://instagram.com/')

  const tiktokSetting = getSetting(['social_tiktok', 'tiktok_username'])
  const tiktokUrl = getSocialUrl(tiktokSetting?.value, 'tiktok', 'https://tiktok.com/@')

  const whatsappSetting = getSetting(['store_whatsapp', 'whatsapp_number'])
  const whatsappUrl = getSocialUrl(whatsappSetting?.value, 'whatsapp', 'https://wa.me/')

  const shopeeSetting = getSetting(['social_shopee'])
  const shopeeUrl = getSocialUrl(shopeeSetting?.value, 'shopee', 'https://shopee.co.id/')

  return {
    ...query,
    settings,
    logoUrl,
    instagramUrl,
    tiktokUrl,
    whatsappUrl,
    shopeeUrl,
  }
}
