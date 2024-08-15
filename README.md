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
        "preview": "vite preview",
        "api:generate": "rm -rf ./src/api && openapi-generator-cli generate -i ./api/swagger.yaml -g typescript-fetch -o ./src/api --additional-properties=typescriptThreePlus=true"
    },
```

to

```json
"scripts": {
        "start": "npm run start",
        "build": "tsc && vite build",
        "preview": "vite preview",
        "api:generate": "rm -rf ./src/api && openapi-generator-cli generate -i ./api/swagger.yaml -g typescript-fetch -o ./src/api --additional-properties=typescriptThreePlus=true"
     },
```

### Start NPM / teddyCloud

Use `./start_dev.sh` to start the NPM server in development mode. Be patient, it may take a while.
Be sure your teddyCloud instance is also running.

If you just need the http variant, simply call `dotenv -e .env.development.local npm start-http`

## Coding guidelines

There are no complete guidelines defined currently, only some fragments which you shall read and follow.

### Design framework

We are using the AntD framework. If you add anything new, try to use AntD components. AntD provides also a wide range of Icons.

More details about can be found here:

-   [AntD](https://ant.design/)
-   [AntD Components](https://ant.design/components/overview)
-   [AntD Icons](https://ant.design/components/icon)

### Usage of Colors

As we support dark and light theme, we ask you to refrain from using explicit color specifications (`#000000`) and to use the colors provided instead:

If not already added, extend the file with

```typescript
import { theme } from "antd";
...
const { useToken } = theme;
...

export const TonieCard: React.FC<{
    overlay: string;
}> = ({ overlay }) => {
...
    const { token } = useToken();
...
```

and then you can use:

```typescript
token.*
// e.g. token.colorTextDisabled
```

### Usage of translations

Please use always `t("...")` instead of hard coded text. Please add the strings in the English, German and French translation Json.

### Adding new API request method

If you need to add a new API request to the TeddyCloud API, please use one of the existing methods in `src/api/apis/TeddyCloudApi.ts`:

-   `apiPostTeddyCloudRaw`
-   `apiPostTeddyCloudFormDataRaw`
-   `apiGetTeddyCloudApiRaw`
-   or any other already existing method in `TeddyCloudApi.ts`

If none of the existing methods meet your needs, add the new request to `src/api/apis/TeddyCloudApi.ts`. We prefer to have all API requests centralized in this file. One reason is the upcoming authentication for accessing the API.

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

Ideally, the TeddyCloudApi.ts should be generated with swagger.yaml. However, it was actually changed manually and new API functions were added directly. This should be revised in the future. Until then, you should NOT generate the API with the openapitools, as this will break the frontend.

## General React App information

## Getting Started with Vite

This project was bootstrapped with [Vite](https://vitejs.dev/).

## Typicale development workflow:

### Install dotenv

Debian: `sudo apt install python3-dotenv-cli`

### additional packages

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

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/guide/).

To learn React, check out the [React documentation](https://reactjs.org/).
