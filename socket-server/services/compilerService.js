const axios = require("axios");

class CompilerService {

    async execute(language, sourceCode, stdin = "") {

        const response = await axios.post(
            "https://emkc.org/api/v2/piston/execute",
            {
                language: language,
                version: "*",
                files: [
                    {
                        content: sourceCode
                    }
                ],
                stdin: stdin
            },
            {
                timeout: 30000
            }
        );

        return response.data;
    }

}

module.exports = new CompilerService();