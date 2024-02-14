import { Database, JSONValue, RequestOptions } from "@azure/cosmos";
import { fromResource } from "./utils";
import Comment from "./models/comment";
import Post from "./models/post";
import User from "./models/user";

const client = (database: Database) => {

    const commentContainer = database.container("comment");
    const readComment = async (id: string, postId: string, options?: RequestOptions) => {
        const { resource } = await commentContainer.item(id, postId).read<Comment>(options);
        return resource ? fromResource(resource) : undefined;
    }
    const readCommentOrThrow = async (id: string, postId: string, options?: RequestOptions) => {
        const response = await readComment(id, postId, options);
        if (!response) {
            throw new Error("comment with id: " + id + " not found.");
        }
        return response;
    }
    const comment = {
        create: (body: Omit<Comment, "id"> & { id?: Comment["id"] }, options?: RequestOptions) => commentContainer.items.create(body, options).then((created) => fromResource(created.resource!) as Comment),
        read: readComment,
        readOrThrow: readCommentOrThrow,
        readAll: (options?: RequestOptions) => commentContainer.items.readAll<Comment>(options),
        readAllByPostId: (postId: string, options?: RequestOptions) => commentContainer.items.query<Comment>({ query: `SELECT * FROM c WHERE c.post.id = @postId`, parameters: [{ name: "@postId", value: postId }] }, options),
        replace: (id: string, postId: string, body: Comment, options?: RequestOptions) => commentContainer.item(id, postId).replace<Comment>(body, options).then((replaced) => fromResource(replaced.resource!)),
        delete: (id: string, postId: string, options?: RequestOptions) => commentContainer.item(id, postId).delete<Comment>(options),
        query: (filter: string, parameters?: { name: `@${string}`; value: JSONValue }[]) => commentContainer.items.query<Comment>({ query: `SELECT * FROM c ${filter}`, parameters })
    }

    const postContainer = database.container("post");
    const readPost = async (id: string, userId: string, options?: RequestOptions) => {
        const { resource } = await postContainer.item(id, userId).read<Post>(options);
        return resource ? fromResource(resource) : undefined;
    }
    const readPostOrThrow = async (id: string, userId: string, options?: RequestOptions) => {
        const response = await readPost(id, userId, options);
        if (!response) {
            throw new Error("post with id: " + id + " not found.");
        }
        return response;
    }
    const post = {
        create: (body: Omit<Post, "id"> & { id?: Post["id"] }, options?: RequestOptions) => postContainer.items.create(body, options).then((created) => fromResource(created.resource!) as Post),
        read: readPost,
        readOrThrow: readPostOrThrow,
        readAll: (options?: RequestOptions) => postContainer.items.readAll<Post>(options),
        readAllByUserId: (userId: string, options?: RequestOptions) => postContainer.items.query<Post>({ query: `SELECT * FROM c WHERE c.user.id = @userId`, parameters: [{ name: "@userId", value: userId }] }, options),
        replace: (id: string, userId: string, body: Post, options?: RequestOptions) => postContainer.item(id, userId).replace<Post>(body, options).then((replaced) => fromResource(replaced.resource!)),
        delete: (id: string, userId: string, options?: RequestOptions) => postContainer.item(id, userId).delete<Post>(options),
        query: (filter: string, parameters?: { name: `@${string}`; value: JSONValue }[]) => postContainer.items.query<Post>({ query: `SELECT * FROM c ${filter}`, parameters })
    }

    const userContainer = database.container("user");
    const readUser = async (id: string, options?: RequestOptions) => {
        const { resource } = await userContainer.item(id, id).read<User>(options);
        return resource ? fromResource(resource) : undefined;
    }
    const readUserOrThrow = async (id: string, options?: RequestOptions) => {
        const response = await readUser(id, options);
        if (!response) {
            throw new Error("user with id: " + id + " not found.");
        }
        return response;
    }
    const user = {
        create: (body: Omit<User, "id"> & { id?: User["id"] }, options?: RequestOptions) => userContainer.items.create(body, options).then((created) => fromResource(created.resource!) as User),
        read: readUser,
        readOrThrow: readUserOrThrow,
        readAll: (options?: RequestOptions) => userContainer.items.readAll<User>(options),
        replace: (id: string, body: User, options?: RequestOptions) => userContainer.item(id, id).replace<User>(body, options).then((replaced) => fromResource(replaced.resource!)),
        delete: (id: string, options?: RequestOptions) => userContainer.item(id, id).delete<User>(options),
        query: (filter: string, parameters?: { name: `@${string}`; value: JSONValue }[]) => userContainer.items.query<User>({ query: `SELECT * FROM c ${filter}`, parameters })
    }

    return {
        comment,
        post,
        user,
    }
}

export type Cosmos = ReturnType<typeof client>;

export default client;
