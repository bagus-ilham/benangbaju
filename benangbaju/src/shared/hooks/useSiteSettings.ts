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
  const normalizeLogoUrl = (url: string | undefined): string => {
    if (!url || url === '/logo.PNG' || url === '/logo.png' || url === '/images/placeholder.jpg') {
      return '/image/svg/logo/logo-benangbaju.svg'
    }
    if (url === '/svg/logo-benangbaju.svg') {
      return '/image/svg/logo/logo-benangbaju.svg'
    }
    return url
  }
  const logoUrl = normalizeLogoUrl(rawLogo)

  const faviconSetting = getSetting(['store_favicon_url'])
  const rawFavicon = faviconSetting?.value?.trim()
  const normalizeFaviconUrl = (url: string | undefined): string => {
    if (!url || url === '/logo_favicon.PNG' || url === '/logo_favicon.png' || url === '/favicon.ico' || url === '/svg/logo-favicon.svg') {
      return '/image/svg/logo/logo-favicon.svg'
    }
    return url
  }
  const faviconUrl = normalizeFaviconUrl(rawFavicon)

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

  const myrRateSetting = getSetting(['myr_exchange_rate'])
  const parsedMyrRate = parseFloat(myrRateSetting?.value || '3600')
  const myrExchangeRate = !isNaN(parsedMyrRate) && parsedMyrRate > 0 ? parsedMyrRate : 3600

  const malaysiaShippingSetting = getSetting(['enable_malaysia_shipping'])
  const isMalaysiaShippingEnabled = malaysiaShippingSetting?.value !== 'false'

  return {
    ...query,
    settings,
    logoUrl,
    faviconUrl,
    instagramUrl,
    tiktokUrl,
    whatsappUrl,
    shopeeUrl,
    myrExchangeRate,
    isMalaysiaShippingEnabled,
  }
}
