import { cosmos } from "./cosmos";

main();

async function main() {
  // read item without knowing which key is partition key
  const author = await cosmos.user.readOrThrow("user1");
  const commentUser = await cosmos.user.readOrThrow("user2");
  const post = await cosmos.post.readOrThrow("post1", author.id);

  // request body is fully typed
  const comment = await cosmos.comment.create({
    id: `comment${new Date().getTime()}`,
    post: {
      id: post.id,
    },
    body: "Hello, world!",
    user: {
      id: commentUser.id,
      name: commentUser.name,
    },
  });

  console.log(
    // response is fully typed
    `#${comment.id} - ${comment.body} (by ${comment.user.name})`
  );

  // but complex queries are not typed and cross partition queries are not checked
  const { resources: helloComments } = await cosmos.comment
    .query(`WHERE CONTAINS(c.body, "Hello")`, [
      { name: "@postId", value: post.id },
    ])
    .fetchAll();

  console.log(`Found ${helloComments.length} "Hello" comments!`);
}
