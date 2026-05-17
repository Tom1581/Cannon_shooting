# Zombie Tide

A mobile-first arcade defense game. Drag your survivor squad along the wall while waves of zombies shamble down the road. Funnel through ammo gates to grow the squad, blast the brutes before they breach the line, survive as long as you can.

Built with React + Vite, rendered entirely on HTML5 Canvas (every sprite is drawn procedurally — no image assets), and packaged for Android via Capacitor.

## Play

1. **Drag left/right** anywhere on the screen to slide your squad.
2. The squad auto-fires upward. Aim with positioning.
3. Pass squad members through `+10` / `×2` ammo gates to reinforce. Avoid red barbed-wire gates that thin the line.
4. Knock down ammo crates with sustained fire — each one breaks open into a permanent firepower upgrade.
5. Brutes have heavy HP — focus fire. If anything reaches the bottom line, the outpost falls.
6. Spend coins on **Fire Power**, **Fire Rate**, or **Squad Size** between waves.

## Development

```bash
npm install
npm run dev          # web dev server (Vite)
npm run build        # production build to dist/
npx cap sync android # push web build into the Android project
npx cap open android # open in Android Studio
```

## AdMob

Rewarded AdMob ads are wired into the in-game `2x COINS` reward. Browser builds keep using the local fake ad overlay; native Android builds use the Capacitor AdMob plugin.

Development uses Google's official Android test IDs:

- App ID: `ca-app-pub-3940256099942544~3347511713`
- Rewarded ad unit: `ca-app-pub-3940256099942544/5224354917`

Before a Play Store release, create your AdMob app and rewarded ad unit, then set:

```bash
# .env.production.local
VITE_ADMOB_ENABLED=true
VITE_ADMOB_TESTING=false
VITE_ADMOB_REWARDED_AD_ID=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
```

And set the native app ID in `android/gradle.properties`:

```properties
adMobApplicationId=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
```

Then rebuild and sync:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Tech

- React 18 + Vite 5
- HTML5 Canvas 2D — all art procedural, zero binary assets
- Web Audio API — all SFX synthesized at runtime
- Capacitor 5 (Android)

## License

Original work. No third-party game art, audio, or trademarks are used. The multiplier-gate mechanic is genre-standard across hypercasual titles and is not subject to copyright.
