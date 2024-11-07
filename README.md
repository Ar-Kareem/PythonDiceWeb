# Description

A website implementing [PythonDice](https://github.com/Ar-Kareem/PythonDice) using Angular v18. 

Try it now: https://ar-kareem.github.io/PythonDiceWeb

The frontend is powered by many packages: Uses [Pyodide](https://pyodide.org) to run the PythonDice python package on the users browser. Uses [Chart.js](https://www.chartjs.org) for visualization. Uses [PrimeNG](https://primeng.org) for a UI Components and [NgRx](https://ngrx.io) for frontend state management.

# Starting Development

As of now, the project only needs the frontend to function, thus it can be deployed using Github pages.

Aside from the tiny share feature which utilizes an external server running the [progshare](https://github.com/Ar-Kareem/progshare) docker container. The website will still function perfectly (without the share feature) in case the progshare server is down.

## Requirements

You really should get nvm (node version manager): [linux](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) / [windows](https://github.com/coreybutler/nvm-windows/releases). Otherwise ignore the `nvm` commands below and just use node version `22.10.0`.

## Start Frontend development

    git clone https://github.com/Ar-Kareem/PythonDiceWeb.git
    cd frontend
    nvm install 22.10.0
    nvm use 22.10.0
    npm install
    npm start
