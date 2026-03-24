function ImageOnlyPage({ imageName, title }) {
  return (
    <main className="image-page" aria-label={title}>
      <img src={`/designs/${imageName}`} alt={`${title} reference`} />
    </main>
  );
}

export default ImageOnlyPage;