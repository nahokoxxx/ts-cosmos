type Comment = {
  id: string;
  body: string;
  user: {
    id: string;
    name: string;
  };
  post: {
    id: string;
  }
};

export const partitionKey = "/post/id";

export default Comment;
