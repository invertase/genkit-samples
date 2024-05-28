# Genkit Natural Language to SQL

This repository contains a sample that demonstrates how to use Genkit to convert natural language questions to SQL queries. The sample uses a dataset of TripAdvisor European Restaurants to demonstrate how to convert natural language questions to SQL queries. After generating a query, you can use the `queryId` to execute the generated query.

> [!NOTE]
> It currently only supports PostgreSQL.

### Setup

You can use the seed script to seed a PostgreSQL database with a sample dataset. You can use the included `docker-compose.yml` file to start a PostgreSQL database along with a PGAdmin instance. Use the following command to start the PostgreSQL database and PGAdmin instance:

```bash
docker compose up
```

You may require to use `sudo` to run the above command. After running the above command, you can access the PGAdmin instance at `http://localhost:5050`. Use the following credentials to log in:

- Email: `user@example.com`
- Password: `password`

After logging in, you can add a new server by right-clicking on the `Servers` node and selecting `Create` > `Server`. Use the following credentials to connect to the PostgreSQL database:

- Host name/address: `db`
- Port: `5432`
- Username: `postgres`
- Password: `password`

After connecting to the PostgreSQL database, you can create a new database by right-clicking on the `Databases` node and selecting `Create` > `Database`. Use the following details to create a new database:

- Name: `genkit`

After creating the database, you can use the seed script to seed the database with the sample dataset. Use the following command to seed the database:

```bash
cd functions
npm install
export DATABASE_URL=postgresql://postgres:password@localhost:5432/genkit
npm run seed
cd ..
```

After seeding the database, you can use the following command to start the server:

```bash
npm run build
firebase emulators:start
```

After starting the server, you will get 2 URLs in the console. One `generateOrExecuteSQL` and one `ask`. You can use the `ask` URL to ask a question about your database structure. You can use the `generateOrExecuteSQL` URL to generate a SQL query or execute a generated query.

You can deploy these functions to Firebase using `firebase deploy --only functions`, and access the functions using the [HTTPS Callable Functions](https://firebase.google.com/docs/functions/callable?gen=2nd).

### Examples

##### Ask a question using the `ask` flow:

```bash
curl --request POST \
  --url http://127.0.0.1:5001/<project-id>/<region>/ask \
  --header 'Accept: application/json, text/plain, */*' \
  --header 'Origin: *' \
  --data '{
  "data": {
    "query": "Can you tell me what column name is for the name of restaurants?"
  }
}'
```

Result:

```json
{
  "result": "The column name for the name of restaurants is **restaurant_name**. \n"
}
```

##### Generate a SQL query using the `generateOrExecuteSQL` flow:

```bash
curl --request POST \
  --url http://127.0.0.1:5001/extensions-testing/us-central1/generateOrExecuteSQL \
  --header 'Accept: application/json, text/plain, */*' \
  --header 'Origin: *' \
  --data '{
  "data": {
    "query": "Find the first 10 restaurants"
  }
}'
```

Result:

```json
{
  "result": {
    "sql": "SELECT * FROM restaurants LIMIT 10;",
    "queryId": "3Pnp2AnbtH0EiLgbPvw7"
  }
}
```

##### Execute a generated SQL query using the `generateOrExecuteSQL` flow using the previously generated `queryId`:

```bash
curl --request POST \
  --url http://127.0.0.1:5001/extensions-testing/us-central1/generateOrExecuteSQL \
  --header 'Accept: application/json, text/plain, */*' \
  --header 'Origin: *' \
  --data '{
  "data": {
    "queryId": "3Pnp2AnbtH0EiLgbPvw7",
    "execute": true
  }
}'
```

Result:

```json
{
  "result": [
    {
      "restaurant_link": "g10001637-d10002227",
      "restaurant_name": "Le 147",
      "original_location": [
        "Europe",
        "France",
        "Nouvelle-Aquitaine",
        "Haute-Vienne",
        "Saint-Jouvent"
      ],
      "country": "France",
      "region": "Nouvelle-Aquitaine",
      "province": "Haute-Vienne",
      "city": "Saint-Jouvent",
      // ...
      "working_shifts_per_week": null,
      "avg_rating": 4,
      "total_reviews_count": 36,
      "default_language": "English",
      "reviews_count_in_default_language": 2,
      "excellent": 2,
      "very_good": 0,
      "average": 0,
      "poor": 0,
      "terrible": 0,
      "food": 4,
      "service": 4.5,
      "value": 4,
      "atmosphere": null,
      "keywords": null
    },
    // 9 more rows
    ]
}
```

### Dataset Credits

The dataset used in this project is the `TripAdvisor European Restaurants` dataset from Kaggle. The dataset used in this sample contains the first 10000 rows from the original dataset. You can find the original dataset [here](https://www.kaggle.com/datasets/stefanoleone992/tripadvisor-european-restaurants?resource=download).

This dataset is licensed under the [Creative Commons Public Domain (CC0)](https://creativecommons.org/publicdomain/zero/1.0/)
