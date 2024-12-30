# Taskerwebview

Application to manage task content from the android application: Tasker

This is built to make it easier to create tasks for the home assistant API.

Current goal is to integrate regular tasker tasks

# Running the appication

## Requirements

- [Node](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (if you build yourself)
- [Docker](https://docs.docker.com/engine/install/) (if you use docker)

## Setting up your environment and connections

- Copy .env.example to a new file in the same root folder named `.env`
- Fill in the details of the environment files, each variable is explained in the comment

### Home assistant setup

- You need a long lived access token from Home assistant, found in: your profile -> security -> long lived access tokens -> create token
- You need to allow access to the home assistant API in the configuration
  - In your home assistant configuration, add a cors_allowed_origins rule to a http block to the url where this application runs for you, normally: `http://localhost:5097`
  - See [this page](https://www.home-assistant.io/integrations/http/) for instructions

### Docker

While in root folder of the cloned folder:

```sh
docker compose up -d
```

Open localhost:5079 in your browser

### Compile and run

#### Install dependencies

```sh
npm install
```

#### Serve application

```sh
npm run build
```

```sh
npm run start
```

In your terminal, you will see which link to open in your browser

#### Development

```sh
npm run dev
```

In your terminal, you will see which link to open in your browser
