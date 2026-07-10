const compilerService = require("../services/compilerService");

class CompilerController {

    async run(req, res) {

        try {

            const { language, code, input } = req.body;

            if (!language || !code) {
                return res.status(400).json({
                    success: false,
                    error: "Language and code are required."
                });
            }

            const result = await compilerService.execute(
                language,
                code,
                input || ""
            );

            return res.json({
                success: true,
                result
            });

        } catch (err) {

            console.error(err.response?.data || err.message);

            return res.status(500).json({
                success: false,
                error: err.response?.data || err.message
            });

        }

    }

}

module.exports = new CompilerController();