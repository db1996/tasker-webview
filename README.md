# Taskerwebview

Application to manage task content from the android application: Tasker

This is built to make it easier to create tasks for the home assistant API.

Current goal is to integrate regular tasker tasks

# Running the appication

## Requirements

- [Node](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (if you build yourself)  
- [Docker](https://docs.docker.com/engine/install/) (if you use docker)

## Docker

While in root folder of the cloned folder:

```sh
docker build -t taskerwebview .
```

```sh
docker run -p -t 5079:5079  taskerwebview
```

Open localhost:5079 in your browser

## Compile and run

### Install dependencies

```sh
npm install
```

### Serve application

```sh
npm run build
```

```sh
npm run start
```

In your terminal, you will see which link to open in your browser

### Development

```sh
npm run dev
```

In your terminal, you will see which link to open in your browser
