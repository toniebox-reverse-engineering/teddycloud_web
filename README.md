# TeddyCloud next Generation Frontend

Welcome to the next generation of the TeddyCloud Administration Frontend!

If you are using this repository for the first time, please refer to the **General React Information** section first.

## TeddyCloud configuration

You'll need to allow CORS for your teddyCloud instance used for development. The easisiest variant is to set `CORS Allow-Originⓘ` to `*`.

## NPM Enviroment file '.env'

Please place an enviroment file '.env.development.local' in the teddycloud_web directory.

```
VITE_APP_TEDDYCLOUD_API_URL=http://<teddycloud-ip>
VITE_APP_TEDDYCLOUD_WEB_BASE=/web
VITE_APP_TEDDYCLOUD_PORT_HTTPS=3443
VITE_APP_TEDDYCLOUD_PORT_HTTP=3000
SSL_CRT_FILE=./localhost.pem
SSL_KEY_FILE=./localhost-key.pem
```

VITE_APP_TEDDYCLOUD_PORT_HTTPS and VITE_APP_TEDDYCLOUD_PORT_HTTP should match the ones entered in the package.json. If you don't change them, these are the ones from the example above.

### Parallel http/https setup

_needed for ESP32 Box Flashing section_

You need to provide certificates for https. Use for example `mkcert`. The generated certificates must be stored in projects root path (or adapt the `env.development.local` file accordingly).

```shell
mkcert -install
mkcert localhost
```

You must also allow unsecure content in chrome ([HowTo](https://stackoverflow.com/questions/18321032/how-to-get-chrome-to-allow-mixed-content)) to be able to connect to teddycloud server in https context.

If you don't need the ESP32 Box flashing section working, you can adapt the `package.json` and change the following:

```json
"scripts": {
        "start-http": "cross-env PORT=3000 vite",
        "start-https": "cross-env HTTPS=true PORT=3443 vite",
        "start": "concurrently \"npm run start-http\" \"npm run start-https\"",
        "build": "tsc && vite build",
        "preview": "vite preview"
    },
```

to

```json
"scripts": {
        "start": "npm run start",
        "build": "tsc && vite build",
        "preview": "vite preview"
     },
```

### Start NPM / teddyCloud

Use `./start_dev.sh` to start the NPM server in development mode. Be patient, it may take a while.
Be sure your teddyCloud instance is also running.

If you just need the http variant, simply call `dotenv -e .env.development.local npm start-http`

## Project Structure & Architecture (Frontend)

The TeddyCloud frontend follows a **topic-based architecture**.  
Pages and components are organized by feature domains (e.g. `tonies`, `tonieboxes`,`settings`, `community`).  
Each feature contains its own components, hooks, and modals.  
This keeps all relevant code physically close, reduces duplication, and maintains clarity.

This architecture represents the intended structure of the frontend; however, due to legacy code and ongoing migration efforts, not all parts of the project fully adhere to it yet.

If you encounter areas that are not yet aligned with this architecture or appear messy, please feel free to clean them up as part of ongoing improvements.

---

### Project Structure

#### Pages

**Location:**  
`src/pages/<topic>/...`

**Purpose:**

-   Represent application routes.
-   Provide layout and structure (`StyledLayout`, `StyledSider`, breadcrumbs).
-   Compose topic-specific components.
-   Contain minimal logic.

**Guidelines:**

-   Pages should stay thin.
-   Do not embed business logic in a Page.
-   Let the page assemble layout + feature components + navigation.

---

#### Components

**Location:**  
`src/components/<topic>/...`

Feature areas (e.g. tonies, settings) contain sub-folders for specific features:

```text
src/components/tonies/encoder/...
src/components/settings/notificationlist/...
src/components/tonieboxes/tonieboxeslist/...
```

**Purpose:**

-   Implement UI behavior for a domain-specific feature.
-   Organize related components, hooks, and modals within the same feature folder.
-   Keep JSX + view logic here, push non-view logic into hooks.

**When to split into a hook?**

-   When a component grows beyond UI concerns.
-   When API logic, state machines, or repeated side effects appear.

---

#### Hooks

Hooks follow the same **topic-based** structure.

##### Feature-specific hooks

**Location examples:**

```text
src/components/tonies/encoder/hooks/useEncoder.ts
src/components/settings/notificationlist/hooks/useNotificationsList.ts
```

**Rules:**

-   Hooks that belong to one feature stay inside that feature’s folder.
-   They encapsulate its behavior: API calls, state transitions, validation, etc.
-   They are not shared across unrelated domains.

This avoids a global “hooks graveyard”.

##### Shared hooks (rare)

Only **domain-agnostic, multi-topic** hooks belong here:

```text
src/hooks/useDebounce.ts
src/hooks/useMediaQuery.ts
```

If it is not 100% generic → **keep it in the feature folder**.

---

#### Modals

Modals follow the feature they belong to.

Example:

```text
src/components/tonies/filebrowser/modals/CreateDirectoryModal.tsx
```

**Guidelines:**

-   State (open/close, selected path, etc.) is controlled in the parent component/hook.
-   Modal components receive all required data via props.
-   Modals should not contain business logic (fetch, validation) unless tightly coupled to the feature.

---

#### Utilities

Generic helpers live in:

```text
src/utils/
```

**Allowed:**

-   Validators
-   Formatter functions
-   Encoding helpers
-   URL builders
-   Type utilities

**Not allowed:**

-   React logic
-   State management
-   Component-specific utilities

---

### Coding Guidelines

There are no complete guidelines defined currently, only some fragments which you shall read and follow.  
The following rules complement the project structure described above.

#### Keep changelog up to date

All changes must be added to the central `CHANGELOG.md` file.  
Whenever you implement a change, add a new entry under the correct version.  
If the next version does not yet exist in the changelog, create a new version block and append your changes there.  
Reference related GitHub issues or pull requests whenever possible.

---

#### Design framework

We are using the AntD framework. If you add anything new, try to use AntD components. AntD also provides a wide range of icons.

More details can be found here:

-   [AntD](https://ant.design/)
-   [AntD Components](https://ant.design/components/overview)
-   [AntD Icons](https://ant.design/components/icon)

When building components, prefer AntD components and patterns over custom HTML whenever possible, to keep the UI consistent.

---

#### Usage of colors

As we support dark and light themes, do **not** use hard-coded colors like `#000000`.  
Instead, always use the AntD theme tokens.

If not already added, extend your file like this:

```typescript
import { theme } from "antd";
...
const { useToken } = theme;
...

export const TonieCard: React.FC<{
    overlay: string;
}> = ({ overlay }) => {
    const { token } = useToken();
    ...
}
```

Then you can use:

```typescript
token.*
// e.g. token.colorTextDisabled
```

This ensures that your component respects both light and dark themes.

---

#### Usage of translations

Always use `t("...")` instead of hard-coded text.

-   Add new strings to the English, German, French and Spanish translation JSON files.
-   Use meaningful, structured keys (e.g. `settings.notifications.title`, `tonies.encoder.uploadHint`).
-   Avoid inline strings in JSX, especially in pages and reusable components.

---

#### Adding new API request methods

If you need to add a new API request to the TeddyCloud API, please use one of the existing helper methods in `src/api/apis/TeddyCloudApi.ts`:

-   `apiPostTeddyCloudRaw`
-   `apiPostTeddyCloudFormDataRaw`
-   `apiGetTeddyCloudApiRaw`
-   or any other already existing method in `TeddyCloudApi.ts`

If none of the existing methods meet your needs, add the new request to `src/api/apis/TeddyCloudApi.ts`.  
We prefer to have all API requests centralized in this file.  
One reason is the upcoming authentication for accessing the API and the possibility to reintroduce generated clients later.

---

#### Linking to other sites

If you need to link to another source, element, or URL, please check if it is already defined in `src/constants/urls.ts`.

-   If it is, use the existing variable instead of hardcoding the URL.
-   If it isn’t, consider adding it as a variable in `src/constants/urls.ts`.

You may need the same URL more than once; defining it in one place ensures that updates are centralized.

Some URLs already defined (partial list):

-   `tonieboxDefaultImageUrl = "https://cdn.tonies.de/thumbnails/03-0009-i.png"`
-   `telegramGroupUrl = "https://t.me/toniebox_reverse_engineering"`
-   `forumUrl = "https://forum.revvox.de/"`
-   `gitHubUrl = "https://github.com/toniebox-reverse-engineering"`
-   `wikiUrl = "https://tonies-wiki.revvox.de/docs/tools/teddycloud/"`

---

### Summary

-   **Pages**: routing and layout per topic, minimal logic.
-   **Components**: topic-specific UI and behavior; move heavy logic into hooks.
-   **Feature hooks**: live next to the components they serve (`src/components/<topic>/<feature>/hooks/`).
-   **Shared hooks**: only for generic, cross-feature helpers in `src/hooks/`.
-   **Modals**: in the topic’s component tree, with parent-controlled state.
-   **Utils**: pure helpers without React or domain-specific dependencies.
-   **Changelog, translations, and design tokens**: keep them consistent and up to date.

This combined structure and guideline set should be followed for all new code and refactorings.

## Tips and Tricks

### Missing img_unknown.png

As the `img_unknown.png` is part of the teddycloud server, normally it's not shown in the running dev environment. To solve that you can do the following:

1. Just add `img_unknown.png` to the `/public` folder.

2. Restart the dev environment.

After these steps, the _img_unknown.png_ should be shown. The file is already part of the file `.gitignore` so you do not have to care about accidentially committing this file.

### Crashing Dev Environment

Sometimes it happens, that the dev environment unexpected crashes. Even after a new start it can crash immediatly. To solve that problem, you can delete the `node_modules` folder and call `npm install` again. Then the `node_modules` will be reloaded and you should be able to restart the dev environment.

## Known Weaknesses

### API Definitions

Ideally, the TeddyCloudApi.ts should be generated using OpenApiTools with the `swagger.yaml`. However, it was actually changed manually and new API functions were added directly. This should be revised in the future. Until then, you should NOT generate the API with the OpenApiTools, as this will break the frontend.

Due to security reasons we removed "@openapitools/openapi-generator-cli" from the devDependencies completely. If you want to refactor the manually changed api functions and bring back support for OpenApiTools, add it and the following in the package.json:

```json
"scripts": {
    ...
    "api:generate": "rm -rf ./src/api && openapi-generator-cli generate -i ./api/swagger.yaml -g typescript-fetch -o ./src/api --additional-properties=typescriptThreePlus=true"
    ...
}
```

## General React App information

## Getting Started with Vite

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Typicale development workflow:

### Preconditions

You have `node.js` and `python` installed.

### Install dotenv

#### Debian

`sudo apt install python3-dotenv-cli`

#### Windows

`pip install python-dotenv` \
followed by \
`pip install "python-dotenv[cli]"`

### Install additional packages

You need to install cross-env:

`npm install --save-dev cross-env`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view the http variant in the browser.
Open [https://localhost:3443](https://localhost:3443) to view the https variant in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

If you changed the default ports, adapt the links above accordingly.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://vitejs.dev/guide/static-deploy.html) for more information.

### `npm run preview`

After building the app, you can test the optimized (minified) production build using this command.
Unlike React’s development mode, which enables features such as hot reloading, detailed error overlays, and repeated API calls for strict mode checks, the preview mode runs the app exactly as it will behave in production.

This means:

-   API calls are executed only once (no double-invocation from React Strict Mode)
-   Performance reflects the real-world production setup
-   You can verify that your build works correctly before deployment

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/guide/).

To learn React, check out the [React documentation](https://reactjs.org/).

# Attribution

The **Open Toniebox Guide** (`src\components\tonieboxes\boxSetup\OpenBoxGuide.tsx`) is based on the following two excellent guides from iFixIt.com:

-   [iFixIt[1]] [Toniebox Opening Procedure](https://www.ifixit.com/Guide/Toniebox+Opening+Procedure/124139)
-   [iFixIt[2]] [Toniebox Teardown](https://www.ifixit.com/Teardown/Toniebox+Teardown/106148)

Both guides were originally written and illustrated by [Tobias Isakeit](https://www.ifixit.com/User/828031/Tobias+Isakeit), who also created all the images used here.

Special thanks to Tobias for providing such clear and detailed instructions!

The icons used are from here:

-   logo.png: https://www.flaticon.com/free-icon/dog_2829818

Thanks for the original authors for these great icons.

The country flags are derived from here:

-   https://gitlab.com/catamphetamine/country-flag-icons v1.5.18.

Thanks to Nikolay Kuchumov for creating this flag collection!
