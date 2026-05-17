# Google Play submission — Zombie Tide

Everything you need to ship the first release of `io.github.a15817348.zombietide`.

## 1. Build a signed AAB

### One-time: create a release keystore
```bash
cd android/app
keytool -genkey -v \
  -keystore zombietide-release.keystore \
  -alias zombietide \
  -keyalg RSA -keysize 2048 -validity 10000
```
Pick a strong password. **Back up `zombietide-release.keystore` somewhere safe — if you lose it, you can never update this listing again.** Add it to `.gitignore` (already covered by the global `*.keystore` rule if you have one; otherwise add it manually).

Create `android/keystore.properties` (also gitignored — see below):
```properties
storeFile=zombietide-release.keystore
keyAlias=zombietide
storePassword=YOUR_STORE_PASS
keyPassword=YOUR_KEY_PASS
```

### One-time: wire signing into `android/app/build.gradle`
Add **above** the `android { ... }` block:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```
Inside `android { ... }`, add a `signingConfigs` block and reference it from the `release` build type:
```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Add to `.gitignore`
```
android/app/*.keystore
android/keystore.properties
```

### Build the AAB
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 2. Verify the bundle before upload
```bash
# Optional but smart: bundletool from https://github.com/google/bundletool
bundletool dump manifest --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  | grep -E 'package|targetSdk|allowBackup|orientation|APPLICATION_ID'
```
Expected:
- `package="io.github.a15817348.zombietide"`
- `targetSdkVersion="35"`
- `allowBackup="false"`
- `screenOrientation="portrait"`
- `com.google.android.gms.ads.APPLICATION_ID` uses your real AdMob app ID, not Google's sample ID.

## 3. AdMob release setup

The app is already wired for rewarded AdMob ads. The checked-in defaults are Google's official Android test IDs, which are correct for development but not for release.

Before uploading to Play Console:

1. Create the app in AdMob.
2. Create a Rewarded ad unit.
3. Add your production rewarded unit to `.env.production.local`:
   ```properties
   VITE_ADMOB_ENABLED=true
   VITE_ADMOB_TESTING=false
   VITE_ADMOB_REWARDED_AD_ID=ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
   ```
4. Add your production AdMob app ID to `android/gradle.properties`:
   ```properties
   adMobApplicationId=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
   ```
5. Run `npm run build && npx cap sync android`, then build the release AAB.

If your Play listing has a developer website, publish an `app-ads.txt` file there using the publisher ID from your AdMob account.

## 4. Play Console questionnaires — answers

**Content rating**
- Violence: **Mild fantasy violence** (cartoon zombies, no blood)
- Realistic violence: **No**
- Blood: **No** (green goo effect — not blood)
- Sexual content: None
- Profanity: None
- Drugs/gambling/user-generated content: None

**Data Safety**
- With AdMob enabled, do not declare "None."
- The game itself only stores local progress/high score on-device, but the Google Mobile Ads SDK may collect and share device identifiers, advertising ID, app interactions, diagnostics, and ad performance data with Google.
- Mark the data purposes that match AdMob: advertising or marketing, analytics, fraud prevention, security, and compliance.
- The app uses `INTERNET` for Capacitor and ad loading.

**Target audience**
- 13+ is the safe pick. If you want Designed for Families, you'll need a stricter privacy policy and the Families program enrollment.

**Privacy policy URL — required.** You need a publicly hosted page. Simplest:
- Create a free GitHub Pages site with a single `privacy.html` explaining that Zombie Tide stores local progress/high score on-device and uses Google AdMob for rewarded ads. Link to Google's privacy policy and disclose that AdMob may process advertising identifiers and ad interaction data.

## 5. Things you cannot change after first publish
- **applicationId** (`io.github.a15817348.zombietide`) — locked forever.
- **The keystore** — back it up redundantly.

## 6. Update flow
For every new release:
1. Bump `versionCode` (must be strictly greater) and `versionName` in `android/app/build.gradle`.
2. `npm run build && npx cap sync android`
3. `cd android && ./gradlew bundleRelease`
4. Upload the new AAB in the Play Console under the same track.

## 7. Regenerating icons / splash
Source SVGs live in `scripts/`. Edit them, then:
```bash
npm run gen-icons
npx cap sync android
```
The PNGs across all densities + splash variants regenerate automatically.
