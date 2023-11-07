# Covalent SDK example
This is an example of how we can integrate **[Covalent SDK](https://thegraph.com/)** with Neon network.

### Setup terminal commands:
* ```npm install``` - Downloading required packages.
* ```npm run dev``` - Starts a local server in your browser & runs sample Covalent requests.

#### API key setup:
To be able to use Covalent SDK you need to generate first API key. Head to **[Covalent website](https://thegraph.com/)** and generate your API key. More info about what else is Covalent SDK offering can be found **[here](https://www.npmjs.com/package/@covalenthq/client-sdk)**.

#### Before starting make sure to create .env.local file containing the following data ( make a copy of .env.local.example file and rename it to .env.local ):
```
    VITE_COVALENT_API_KEY=XYZ
```
- *VITE_COVALENT_API_KEY - this is the Covalent API KEY.*