# Standalone Auth API

Standalone authentication service can communicate your next project to inhance basic auth facilities. How it works? like we say **Standalone** it work like branches. Further information will come soon ...

## Features

- Register, Login, Logout, Reset Password
- Provider ( who used this api to create resources)
- Consumer ( who consume this api under specific providers(key) )
  Others features like **JWT** access & refresh token, key rotation, multi resource validation also available in the formate

## Run Locally

Clone the project

```bash
  git clone https://github.com/Rasel-Dev/standalone-auth-api.git
```

Go to the project directory

```bash
  cd standalone-auth-api
```

Install dependencies

```bash
  yarn install
```

Start the server

```bash
  yarn run serve
```

## Thunder Client ( optional )

If you use **Thunder client** then you can setup our thunder configs from **Thunder** folder.

- import **Thunder/thunder-environment.json** inside **Env** tab
- import **Thunder/thunder-collection.json** inside **Collections** tab
- Setting up env to your collections

## Documentation

[Upcoming...](https://github.com/Rasel-Dev)

## Tech Stack

**Client:** Not yet

**Server:** Node, Express, Postgresql
