# TeddyCloud next Generation Frontend

Welcome to the next generation of the TeddyCloud Administration Frontend!

If you are using this repository for the first time, please refer to the **General React Information** section first.

## TeddyCloud configuration

You'll need to allow CORS for your teddyCloud instance used for development. The easisiest variant is to set `CORS Allow-Originⓘ` to `*`.

## NPM Enviroment file '.env'

Please place an enviroment file '.env.development.local' in the teddycloud_web directory.

```
REACT_APP_TEDDYCLOUD_API_URL=http://<teddycloud-ip>
REACT_APP_TEDDYCLOUD_WEB_BASE=/web
PORT_HTTPS=3443
PORT_HTTP=3000
SSL_CRT_FILE=./localhost.pem
SSL_KEY_FILE=./localhost-key.pem
```

PORT_HTTPS and PORT_HTTP should match the ones entered in the package.json. If you don't change them, these are the ones from the example above.

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
        "build": "react-scripts build",
        "start-http": "cross-env PORT=3000 react-scripts start",
        "start-https": "cross-env HTTPS=true PORT=3443 react-scripts start",
        "start": "concurrently \"npm run start-http\" \"npm run start-https\"",
        "api:generate": "rm -rf ./src/api && openapi-generator-cli generate -i ./api/swagger.yaml -g typescript-fetch -o ./src/api --additional-properties=typescriptThreePlus=true",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
    },
```

to

```json
"scripts": {
        "build": "react-scripts build",
        "start": "react-scripts start",
        "api:generate": "rm -rf ./src/api && openapi-generator-cli generate -i ./api/swagger.yaml -g typescript-fetch -o ./src/api --additional-properties=typescriptThreePlus=true",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
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

1. Add `img_unknown.png` to the `/public` folder.
2. Create the file `setupProxy.js` in `/src` with the following content:

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
    app.use(
        "/img_unknown.png",
        createProxyMiddleware({
            target: "http://localhost:" + process.env.REACT_APP_TEDDYCLOUD_PORT_HTTP,
            changeOrigin: true,
            pathRewrite: {
                "^/img_unknown.png": process.env.REACT_APP_TEDDYCLOUD_WEB_BASE + "/img_unknown.png",
            },
        })
    );
    app.use(
        "/img_unknown.png",
        createProxyMiddleware({
            target: "https://localhost:" + process.env.REACT_APP_TEDDYCLOUD_PORT_HTTPS,
            changeOrigin: true,
            pathRewrite: {
                "^/img_unknown.png": process.env.REACT_APP_TEDDYCLOUD_WEB_BASE + "/img_unknown.png",
            },
        })
    );
};
```

3. Restart the dev environment.

After these steps, the _img_unknown.png_ should be shown. Both files are already part of the file `.gitignore` so you do not have to care about accidentially committing them.

### Crashing Dev Environment

Sometimes it happens, that the dev environment unexpected crashes. Even after a new start it can crash immediatly. To solve that problem, you can delete the `node_modules` folder and call `npm install` again. Then the `node_modules` will be reloaded and you should be able to restart the dev environment.

## Known Weaknesses

### API Definitions

Ideally, the TeddyCloudApi.ts should be generated with swagger.yaml. However, it was actually changed manually and new API functions were added directly. This should be revised in the future. Until then, you should NOT generate the API with the openapitools, as this will break the frontend.

## General React App information

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
