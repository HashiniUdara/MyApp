npm install

npx expo start

npx expo install react-native-web@~0.18.10 react-dom@18.2.0 @expo/webpack-config@^18.0.1

<!-- reminder -->
npx expo install expo-notifications @react-native-community/datetimepicker

<!-- notifications -->
npx expo install expo-notifications

<!-- user able to use app without sign up all the time -->
npx expo install @react-native-async-storage/async-storage

npx expo install react-native-svg

npx expo install expo-linking



<!-- build apk and test-->
npm install -g eas-cli
npm install
eas login
eas build:configure
    eas.json <- modify according to your need
eas build -p android --profile preview
    scan the QR from phone
    download tha apk
    install the apk


<!-- database -->
supabase


<!-- run this for all the tables to remove RLS -->
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;',
            r.schemaname,
            r.tablename
        );
    END LOOP;
END $$;

