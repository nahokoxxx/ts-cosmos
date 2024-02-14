type Post = {
  id: string;
  title: string;
  body: string;
  user: {
    id: string;
    name: string;
  };
};

export const partitionKey = "/user/id";

export default Post;
