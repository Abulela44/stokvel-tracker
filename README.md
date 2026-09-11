# Stokvel Buddy

Build a mobile-first web app called 'Stokvel Tracker SA' for South African stokvels with warm gold and dark green styling, designed for low-data/low-end Android devices.

Key features:
1. Create Stokvel (name, monthly contribution R100–R2000, meeting date, admin phone).
2. Member management (add name + phone, track total paid/balance, WhatsApp invite generator, free tier limit).
3. Payments dashboard (Jan–Dec matrix grid, tap cell to toggle paid/unpaid, totals for collected/outstanding/balance).
4. Balance & Payout rotation (ordered rotation schedule, calculates payout amounts from contributions, admin reordering).
5. WhatsApp reminders (personalized template with stokvel name, due date, balance, click-to-chat via wa.me link).
6. Multilingual support (English, isiXhosa, isiZulu) for core navigation, labels, and messages.
7. Monetization tiers & upgrade prompts (Free up to 15 members; Pro R39/mo with clean pricing page).
8. Mobile-first UI with large tap targets, high contrast, clean states, and phone-based auth flow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://stokvel-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e381a821-53ee-4a07-b64a-5b057752b9b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
