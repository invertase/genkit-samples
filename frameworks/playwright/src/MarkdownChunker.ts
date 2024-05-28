type Chunk = {
    header: string,
    paragraphs: Array<Array<string>> // Each paragraph is an array of sentences.
};

// Function to chunk Markdown text
export function chunkMarkdown(markdown: string): Chunk[] {
    const chunks: Chunk[] = [];
    const headerRegex = /^(#+)\s*(.*)/gm; // Regex to find Markdown headers
    const paragraphRegex = /(?:\r?\n){2,}/g; // Regex to split text into paragraphs based on empty lines
    const sentenceRegex = /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/g; // Regex to split paragraphs into sentences

    // Split the markdown text by headers
    let sections = markdown.split(headerRegex).slice(1); // Remove the first empty split

    for (let i = 0; i < sections.length; i += 3) {
        let level = sections[i]; // Header level (not used in current structuring)
        let header = sections[i + 1].trim(); // Header text
        let content = sections[i + 2].trim(); // Content under the header

        let paragraphs = content.split(paragraphRegex).filter(p => p.trim() !== ''); // Split into paragraphs and filter out empty ones
        let paragraphArray: Array<Array<string>> = [];

        // Split each paragraph into sentences
        for (let paragraph of paragraphs) {
            let sentences = paragraph.split(sentenceRegex).map(s => s.trim()).filter(s => s !== ''); // Split and trim sentences
            paragraphArray.push(sentences);
        }

        chunks.push({
            header,
            paragraphs: paragraphArray
        });
    }

    return chunks;
}
