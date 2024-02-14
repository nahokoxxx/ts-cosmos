import { Project, WriterFunction } from "ts-morph";
import path from "path";

generateClientFactory().then(() => {
  console.log("Cosmos client factory generation succeeded.");
});

function generateClientFactory() {
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, "./tsconfig.json"),
  });

  const modelFiles = project
    .getDirectoryOrThrow(path.join(__dirname, "./models"))
    .getSourceFiles();

  const models = modelFiles.map((file) => {
    const modelName = file.getBaseNameWithoutExtension();
    const partitionKey = file
      .getVariableDeclarationOrThrow("partitionKey")
      .getInitializerOrThrow()
      .getText()
      .replaceAll(`"`, "");
    return {
      file,
      name: modelName,
      typeName: capitalize(modelName),
      partitionKey,
    };
  });

  const write: WriterFunction = (writer) => {
    writer.writeLine(
      `import { Database, JSONValue, RequestOptions } from "@azure/cosmos";`
    );
    writer.writeLine(`import { fromResource } from "./utils";`);

    models.forEach(({ name, typeName }) => {
      writer.writeLine(`import ${typeName} from "./models/${name}";`);
    });

    writer.blankLine();

    writer.write("const client = (database: Database) =>").block(() => {
      models.forEach(({ name, typeName, partitionKey: rawPartitionKey }) => {
        const containerVariableName = `${name}Container`;
        const partitionKeyItems = rawPartitionKey
          .split("/")
          .filter((item) => !!item);
        const partitionKey = partitionKeyItems
          .map((item, index) => (index === 0 ? item : capitalize(item)))
          .join("");
        const partitionKeyIsId = partitionKey === "id";
        const partitionKeyParam = partitionKeyIsId
          ? ""
          : `${partitionKey}: string, `;
        const readFunctionName = `read${capitalize(name)}`;

        writer.blankLine();
        writer.writeLine(
          `const ${containerVariableName} = database.container("${name}");`
        );
        writer
          .write(
            `const ${readFunctionName} = async (id: string, ${partitionKeyParam}options?: RequestOptions) =>`
          )
          .block(() => {
            writer.writeLine(
              `const { resource } = await ${containerVariableName}.item(id, ${partitionKey}).read<${typeName}>(options);`
            );
            writer.writeLine(
              "return resource ? fromResource(resource) : undefined;"
            );
          });
        writer
          .write(
            `const ${readFunctionName}OrThrow = async (id: string, ${partitionKeyParam}options?: RequestOptions) =>`
          )
          .block(() => {
            writer.writeLine(
              `const response = await ${readFunctionName}(id, ${
                partitionKeyIsId ? "" : `${partitionKey}, `
              }options);`
            );
            writer.write("if (!response)").block(() => {
              writer.writeLine(
                `throw new Error("${name} with id: " + id + " not found.");`
              );
            });
            writer.writeLine(`return response;`);
          });
        writer.write(`const ${name} =`).block(() => {
          writer.writeLine(
            `create: (body: Omit<${typeName}, "id"> & { id?: ${typeName}["id"] }, options?: RequestOptions) => ${containerVariableName}.items.create(body, options).then((created) => fromResource(created.resource!) as ${typeName}),`
          );
          writer.writeLine(`read: ${readFunctionName},`);
          writer.writeLine(`readOrThrow: ${readFunctionName}OrThrow,`);
          writer.writeLine(
            `readAll: (options?: RequestOptions) => ${containerVariableName}.items.readAll<${typeName}>(options),`
          );
          if (!partitionKeyIsId) {
            writer.writeLine(
              `readAllBy${capitalize(
                partitionKey
              )}: (${partitionKey}: string, options?: RequestOptions) => ${containerVariableName}.items.query<${typeName}>({ query: \`SELECT * FROM c WHERE c.${partitionKeyItems.join(
                "."
              )} = @${partitionKey}\`, parameters: [{ name: "@${partitionKey}", value: ${partitionKey} }] }, options),`
            );
          }
          writer.writeLine(
            `replace: (id: string, ${partitionKeyParam}body: ${typeName}, options?: RequestOptions) => ${containerVariableName}.item(id, ${partitionKey}).replace<${typeName}>(body, options).then((replaced) => fromResource(replaced.resource!)),`
          );
          writer.writeLine(
            `delete: (id: string, ${partitionKeyParam}options?: RequestOptions) => ${containerVariableName}.item(id, ${partitionKey}).delete<${typeName}>(options),`
          );
          writer.writeLine(
            `query: (filter: string, parameters?: { name: \`@\${string}\`; value: JSONValue }[]) => ${containerVariableName}.items.query<${typeName}>({ query: \`SELECT * FROM c \${filter}\`, parameters })`
          );
        });
      });

      writer.blankLine();

      writer.write("return").block(() => {
        models.forEach(({ name }) => {
          writer.writeLine(`${name},`);
        });
      });
    });

    writer.blankLine();

    writer.writeLine("export type Cosmos = ReturnType<typeof client>;");

    writer.blankLine();

    writer.writeLine("export default client;");
  };

  const generated = project.createSourceFile(
    path.join(__dirname, `./clientFactory.ts`),
    write,
    { overwrite: true }
  );

  return generated.save();
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
