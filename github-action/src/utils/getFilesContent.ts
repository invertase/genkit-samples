import * as fs from 'fs';
import * as path from 'path';

interface FileContentMap {
    [fileName: string]: string;
}

export function getFilesContent(directory: string,  extension: string, excludePatterns: RegExp[] = [], charLimit?: number,): FileContentMap {
    const filesContent: FileContentMap = {};
    let totalChars = 0;

    function traverseDir(currentPath: string) {
        if (charLimit && (totalChars >= charLimit)) {
            return;
        }

        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            if (excludePatterns.some(pattern => pattern.test(fullPath))) {
                continue;
            }

            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                traverseDir(fullPath);
            } else if (stats.isFile() && path.extname(item) === extension) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const contentLength = content.length;

                if (charLimit && (totalChars + contentLength > charLimit)) {
                    const remainingChars = charLimit - totalChars;
                    filesContent[fullPath] = content.slice(0, remainingChars);
                    totalChars += remainingChars;
                    break;
                } else {
                    filesContent[fullPath] = content;
                    totalChars += contentLength;
                }

                if (charLimit && (totalChars >= charLimit)) {
                    break;
                }
            }
        }
    }

    traverseDir(directory);
    return filesContent;
}


