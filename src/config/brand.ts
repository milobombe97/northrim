/** Single source for North Rim Inc. product copy and URLs. */
export const brand = {
  legalName: 'North Rim Inc',
  shortName: 'North Rim',
  wordmark: 'North Rim Inc',
  domain: 'northrimbankinc.com',
  publicUrl: 'https://northrimbankinc.com',
  dashboardPath: '/dashboard',
  supportEmail: 'info@northrimbankinc.com',
  adminEmail: 'info@northrimbankinc.com',
  registeredAddress: 'North Rim Inc., United States',
  peerTransferLabel: 'Another North Rim customer',
  peerTransferShort: 'North Rim customer',
  fileStoreDbName: 'north-rim-files',
} as const

export function dashboardUrl(origin = brand.publicUrl) {
  return `${origin.replace(/\/$/, '')}${brand.dashboardPath}`
}

export const mailtoSupport = `mailto:${brand.supportEmail}`
