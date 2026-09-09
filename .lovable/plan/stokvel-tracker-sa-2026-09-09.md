# Stokvel Tracker SA

A mobile-first app for running a South African stokvel: members, monthly contributions, payment grid, payout rotation, and WhatsApp reminders. Warm gold on deep green, built to stay light on data and work on low-end Android phones.

## Screens

1. **Welcome / sign in** — phone-number based sign-in (enter number, confirm with a code), language picker (English, isiXhosa, isiZulu) right on the first screen.
2. **Create stokvel** — name, monthly contribution (R100–R2000 slider + input), meeting day of month, admin phone.
3. **Members** — list with name, phone, total paid, balance. Add member sheet. "Invite on WhatsApp" opens WhatsApp with a ready message. Free plan stops at 15 members with an upgrade prompt.
4. **Payments** — Jan–Dec grid, one row per member. Tap a cell to mark paid/unpaid. Sticky totals bar: collected, outstanding, balance.
5. **Payout rotation** — ordered list of who gets paid which month, payout amount worked out from contributions, admin can move members up/down.
6. **Reminders** — pick members, preview the personalised message (stokvel name, due date, outstanding balance), send one by one via WhatsApp.
7. **Pricing** — Free (up to 15 members) vs Pro R39/month, single clear call to action.
8. **Settings** — language, stokvel details, sign out.

## Language support

All navigation, labels, buttons, empty states, and WhatsApp message templates in English, isiXhosa, isiZulu. Choice is remembered per user. Numbers and rand amounts formatted for South Africa.

## Design

- Deep green background surfaces, warm gold as the action colour, cream text; high contrast throughout.
- Tap targets at least 48px, bottom tab navigation, single-column layouts, generous spacing.
- No large images, no heavy animation, system-safe fonts with one display face — keeps pages small and fast.
- Clear loading, empty, and error states on every screen.

## Backend

Uses Lovable Cloud for phone sign-in and to store stokvels, members, payments, rotation order, and plan tier, so data survives reinstalls and can be shared with a co-admin later. Data is scoped so each admin only ever sees their own stokvel.

## Technical notes

- Tables: `profiles`, `stokvels`, `members`, `payments` (member + month + year + paid), `rotation` (member + position + payout month). Row-level security keyed to the signed-in admin, with grants for the app roles.
- Payment grid stores one row per member/month only when marked paid, keeping reads small; totals computed client-side from a single fetched set.
- Balance = collected − paid-out; payout per turn = monthly contribution × member count.
- Reminders and invites are plain `wa.me` links with URL-encoded text — no messaging service or cost involved.
- Pro tier is a flag on the stokvel with upgrade prompts; payment processing is not wired up in this build.
- Translations in a small typed dictionary with a `useT()` hook, no i18n library.

## Not included yet

- Real card payment for the Pro upgrade (needs a payments provider decision).
- Multiple admins per stokvel, exports, and push notifications.
