import { chromium, Browser, Page, Locator } from "playwright";

// Class to manage browser interactions using Playwright
export class BrowserNavigator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {}

  async launchBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: false, slowMo: 50 });
      console.log("Browser launched successfully.");
    } else {
      console.log("Browser is already launched.");
    }
  }

  async navigateToUrl(url: string): Promise<void> {
    if (!this.browser) {
      console.error("Browser not initialized. Call launchBrowser() first.");
      return;
    }

    try {
      // Create a new page
      this.page?.close();

      this.page = await this.browser.newPage();

      // Navigate to the specified URL
      await this.page.goto(url);

      console.log(`Navigation to ${url} was successful.`);
    } catch (error) {
      console.error("Failed to navigate:", error);
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("Browser closed successfully.");
    } else {
      console.log("No browser to close.");
    }
    if (this.page) {
      this.page.close();
      this.page = null;
    }
  }

  // Method to find an element by its text content
  async findElementByText(text: string): Promise<Locator | void> {
    if (!this.browser) {
      console.error("Browser not initialized. Call launchBrowser() first.");
      return;
    }

    try {
      if (!this.page) {
        this.page = await this.browser.newPage();
      }

      // Finding an element by its text content
      const element = this.page.locator(`text="${text}"`).first();
      if ((await element.count()) > 0) {
        console.log(`Element with text "${text}" found.`);
        return element;
        // Perform actions on the element if necessary
      } else {
        console.log(`No element with text "${text}" found.`);
      }
    } catch (error) {
      console.error("Error finding element:", error);
    }
  }

  async getBodyElement(): Promise<Locator> {
    if (!this.browser) {
      throw new Error("Browser not initialized. Call launchBrowser() first.");
    }

    if (!this.page) {
      console.error("No page available. Navigate to a URL first.");
      throw new Error("No page available. Navigate to a URL first.");
    }

    try {
      const bodyElement = this.page.locator("body").first();
      if ((await bodyElement.count()) > 0) {
        console.log("Body element retrieved successfully.");
        return bodyElement;
      } else {
        throw new Error("No body element found.");
      }
    } catch (error) {
      throw new Error(`Error retrieving body element: ${error}`);
    }
  }

  async getAllLinks(): Promise<string[]> {
    if (!this.browser) {
      console.error("Browser not initialized. Call launchBrowser() first.");
      return [];
    }

    if (!this.page) {
      console.error("No page available. Navigate to a URL first.");
      return [];
    }

    try {
      const linkElements = this.page.locator("a");
      const linkCount = await linkElements.count();
      const links: string[] = [];

      for (let i = 0; i < linkCount; i++) {
        const hrefValue = await linkElements.nth(i).getAttribute("href");
        if (hrefValue) {
          links.push(hrefValue);
        }
      }

      console.log(`Found ${links.length} links on the page.`);
      return links;
    } catch (error) {
      console.error("Error retrieving links:", error);
      return [];
    }
  }

  async getPageHtml(): Promise<string> {
    if (!this.browser) {
      throw new Error("Browser not initialized. Call launchBrowser() first.");
    }

    if (!this.page) {
      throw new Error("No page available. Navigate to a URL first.");
    }

    try {
      // Get the HTML content of the current page
      const pageHtml = await this.page.content();
      console.log("HTML content retrieved successfully.");
      return pageHtml;
    } catch (error) {
      throw new Error(`Error retrieving page HTML: ${error}`);
    }
  }
}
