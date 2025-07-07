'use server'

import { getShippingCharge as getChargeFromSettings } from '@/lib/settings'

export async function getShippingCharge() {
    return await getChargeFromSettings();
}
