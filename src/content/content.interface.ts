interface Content {
  id: Number;
  title: string;
  contain: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  filesUrl: string[];
  commingSoonAt?: Date;
}
export default Content;
