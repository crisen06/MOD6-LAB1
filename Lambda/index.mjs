import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

// Cliente DynamoDB. La región será tomada automáticamente del entorno de Lambda.
const dynamoClient = new DynamoDBClient({});

// Convierte un item de DynamoDB AttributeValue a un objeto JSON simple.
// Para el laboratorio solo se consideran tipos String y Number.
function fromDynamoDbItem(item) {
  const result = {};

  for (const [key, value] of Object.entries(item)) {
    if (value.S !== undefined) {
      result[key] = value.S;
    } else if (value.N !== undefined) {
      result[key] = Number(value.N);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export const handler = async (event) => {
  // La tabla por defecto debe ser Products.
  // Sin embargo, para evidenciar el riesgo, permitimos recibir tableName por evento.
  const tableName = event.tableName || process.env.PRODUCTS_TABLE;
  const id = event.id || "P001";

  console.log("Solicitud recibida", {
    tableName,
    id
  });

  try {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: {
        id: { S: id }
      },
      ConsistentRead: true
    });

    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Item no encontrado",
          tableName,
          id
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Consulta realizada correctamente",
        tableName,
        data: fromDynamoDbItem(response.Item)
      }, null, 2)
    };
  } catch (error) {
    console.error("Error al consultar DynamoDB", {
      name: error.name,
      message: error.message
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error al consultar DynamoDB",
        tableName,
        id,
        errorName: error.name,
        errorMessage: error.message
      }, null, 2)
    };
  }
};