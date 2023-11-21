# Covalent SDK example
This is an example of how we can integrate the **[Covalent SDK](https://www.covalenthq.com)** with the Neon EVM network.

### Setup terminal commands:
* ```npm install``` - Downloads required packages
* ```npm run dev``` - Starts a local server in your browser & runs sample Covalent requests

#### API key setup:
To be able to use Covalent SDK you need to generate an API key. Head to **[Covalent website](https://www.covalenthq.com/platform/auth/register/)** to register and generate your API key. More info about Covalent's SDK offering can be found **[here](https://www.npmjs.com/package/@covalenthq/client-sdk)**.

#### Before starting, make sure to create .env.local file containing the following data (make a copy of .env.local.example file and rename it to .env.local):
```
    VITE_COVALENT_API_KEY=XYZ
```
- {XYZ} - is your Covalent API KEY.*