import fs from "fs";

export const deleteFile = (filePath: fs.PathLike) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    });
}
