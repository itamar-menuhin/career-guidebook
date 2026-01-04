export default function remarkGfm() {
  return function identity(tree: unknown) {
    return tree;
  };
}
