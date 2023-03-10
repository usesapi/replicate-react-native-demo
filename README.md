# Sapi
This project uses [Sapi](https://usesapi.com) to allow using the replicate API without developing a backend. To learn more, visit the full tutorial at: https://sapi.gitbook.io/replicate.com-apps-tutorials/react-native-describe-any-photo-just-by-looking-at-it

# How To Use

## Prerequisites

1. Node.js and npm (comes with Node) installed on your machine. We recommend to use [NVM](https://github.com/nvm-sh/nvm).
2. Expo CLI installed on your machine. You can install it by running `npm install -g expo-cli`


## Cloning the app

Open a terminal and navigate to the directory where you want to clone the app.\
Run the command `git clone git@github.com:usesapi/replicate-react-native-demo.git`

## Get Replicate API Token
Sign in to your replicate account, open the [Account](https://replicate.com/account) page and copy your API Token.

## Create Sapi Account

Sign in to [Sapi](https://console.usesapi.com), create a new Replicate Sapi and configure it with the Replicate API Token.

## Set your Sapi Id

In the App.tsx (line 6) set your Sapi ID

## Running the app

Run the command `npm install` to install all the necessary dependencies.\
Run the command `expo start` to start the Expo development server.\
Open the Expo app on your mobile device and scan the QR code displayed in the terminal or in the browser.

