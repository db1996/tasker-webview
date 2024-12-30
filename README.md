# Taskerwebview

Application to manage task content from the android application: Tasker

This is built to make it easier to create tasks for the home assistant API.

Current goal is to integrate regular tasker tasks

# Running the appication

## Requirements

- [Docker](https://docs.docker.com/engine/install/) (if you use docker)
- [Node](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (ONLY if you build yourself)

## Setting up your environment and connections

- Copy .env.example to a new file in the same root folder named `.env`
- Fill in the details of the environment files, each variable is explained in the comment

### Tasker

In order to use this with tasker, you need to enable the new 2024/2025 UI

- In tasker -> top right 3 dots -> preferences
- Turn on Use Tasker 2024 UI (VERY EARLY) (2025 in some tasker versions)

The app can only connect if you have that on, and you are in a task at the same time. I do not have access to a list of tasks. Nor do i have the ability to interact with tasks outside the current open task. If you do not have a task open the application won't be able to connect to tasker.

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

#### Update

If an update has come out, you need to rebuild in docker

```sh
docker compose down
```

```sh
 docker compose up -d --no-deps --build
```

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
