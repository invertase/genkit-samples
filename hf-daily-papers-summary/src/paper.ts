import pdf from "pdf-parse";
import { chunk } from "llm-chunk";

export class PapersService {
  private readonly apiEndpoint = "https://huggingface.co/api/daily_papers";
  private getTodayPapersEndpoint = () =>
    `${this.apiEndpoint}?date=${new Date().toISOString().split("T")[0]}`;

  private getArxivPaperUrl = (paperId: string) =>
    `https://arxiv.org/pdf/${paperId}.pdf?download=true`;

  async getTodayPapers() {
    const response = await fetch(this.getTodayPapersEndpoint());
    const papers = await response.json();

    return papers as Paper[];
  }

  async getPapersByDate(date: Date) {
    const dateString = date.toISOString().split("T")[0];
    const response = await fetch(`${this.apiEndpoint}?date=${dateString}`);
    const papers = await response.json();

    papers.forEach((paper: any) => {
      paper.arxiv = this.getArxivPaperUrl(paper.paper.id);
      paper.summary = paper.paper.summary.replace(/<[^>]*>?/gm, "");
      paper.id = paper.paper.id;
    });

    return papers as Paper[];
  }

  private async parsePdf(buffer: Buffer) {
    try {
      const data = await pdf(buffer, { max: 1 });

      var text = data.text;
      console.log(text.length);
      text = text.replace(/<[^>]*>/g, "");
      text = text.replace(/&nbsp;/g, " ");
      text = text.replace(/[^\w\s]/g, " ");
      text = text.replace(/\s+/g, " ");
      text = text.replace(/\s{2,}/g, " ");

      const chunks = chunk(text, {
        splitter: "paragraph",
        minLength: 100,
        maxLength: 200,
        overlap: 0.1,
        delimiters: "\n",
      });

      console.log(
        ">>>>>>>>>>>>>>>>>>>> " + chunks.length + " >>>>>>>>>>>>>>>>>>>>"
      );

      return [text];
    } catch (err) {
      console.error(err);
      throw new Error("Failed to parse PDF");
    }
  }

  async extractTextFromPdf(pdfUrl: string): Promise<string[]> {
    const text = await fetch(pdfUrl).then((res) => res.arrayBuffer());
    return await this.parsePdf(Buffer.from(text));
  }
}

interface Paper {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  mediaUrl: string;
  upvotes: number;
  arxiv: string;
  content?: string;
}
