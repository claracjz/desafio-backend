const pool = require('../conexao')
const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt')

const listarCategorias = async (req, res) => {
    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        const { rows } = await pool.query('select * from categorias')

        return res.status(200).json(rows)

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

module.exports = {
    listarCategorias
}