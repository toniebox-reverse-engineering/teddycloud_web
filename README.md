# TeddyCloud next Generation Frontend

Welcome to the next generation of the TeddyCloud Administration Frontend!

If you are using this repo the first time, have a look in section General React Information first.

## TeddyCloud configuration

You'll need to allow CORS for your teddyCloud instance used for development. The easisiest variant is to set `CORS Allow-Originⓘ` to `*`.

## NPM Enviroment file '.env'

Please place an enviroment file '.env.development.local' in the teddycloud_web directory.

```
REACT_APP_TEDDYCLOUD_API_URL=http://<teddycloud-ip>
REACT_APP_TEDDYCLOUD_WEB_BASE=/web
```

### Start NPM / teddyCloud

Use `./start_dev.sh` to start the NPM server in development mode. Be patient, it may take a while.
Be sure your teddyCloud instance is also running.

## Coding guidelines

There are no complete guidelines defined currently, only some fragments which you shall read and follow.

### Design framework

We are using the AntD framework. If you add anything new, try to use AntD components. AntD provides also a wide range of Icons.

More details about can be found here:

-   [AntD](https://ant.design/)
-   [AntD Components](https://ant.design/components/overview)
-   [AntD Icons](https://ant.design/components/icon)

### Usage of Colors

As we support dark and light theme, we ask you to refrain from using explicit color specifications (#000000) and to use the colors provided instead:

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

### Use translations

Please use always t("...") instead of hard coded text. Add the strings both in the german and english translation.json.

## Known Weaknesses

### API Definitions

Ideally, the TeddyCloudApi.ts should be generated with swagger.yaml. However, it was actually changed manually and new API functions were added directly. This should be revised in the future. Until then, you should NOT generate the API with the openapitools, as this will break the frontend.

## General React App information

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Typicale development workflow:

### Install dotenv

Debian: `sudo apt install python3-dotenv-cli`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

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
