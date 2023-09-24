const bcrypt = require('bcrypt')
const pool = require('../conexao')
const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt')

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        }

        const emailExiste = await pool.query('select * from usuarios where email = $1', [email])

        if (emailExiste.rowCount > 0) {
            return res.status(400).json({ mensagem: 'Email já cadastrado' })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const query = `
            insert into usuarios (nome, email, senha)
            values ($1, $2, $3) returning *       
        `

        const { rows } = await pool.query(query, [nome, email, senhaCriptografada])

        const { senha: _, ...usuario } = rows[0]

        return res.status(201).json(usuario)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

const loginUsuario = async (req, res) => {
    const { email, senha } = req.body

    try {
        if (!email || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        }

        const usuario = await pool.query(
            'select * from usuarios where email = $1', [email]
        )

        if (usuario.rowCount < 1) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' })
        }

        const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha)

        if (!senhaValida) {
            return res.status(404).json({ mensagem: 'Email ou senha inválidos' })
        }

        const token = jwt.sign({ id: usuario.rows[0].id }, senhaJwt, { expiresIn: '1h' })

        const { senha: _, ...usuarioLogado } = usuario.rows[0]

        return res.json({ usuario: usuarioLogado, token })
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

const detalharUsuario = async (req, res) => {
    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        const { rows, rowCount } = await pool.query('select * from usuarios where id = $1', [id])

        if (rowCount < 1) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' })
        }

        const { senha: _, ...usuarioLogado } = rows[0]

        return res.json(usuarioLogado)

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }

}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body
    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        }

        const emailExiste = await pool.query('select * from usuarios where email = $1', [email])

        if (emailExiste.rowCount > 0) {
            return res.status(400).json({ mensagem: 'Email já cadastrado' })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        await pool.query('update usuarios set nome = $1, email = $2, senha = $3 where id = $4',
            [nome, email, senhaCriptografada, id])


        return res.status(204).send()

    } catch (error) {
        return res.status(500).json('Erro inesperado')
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario,
    detalharUsuario,
    atualizarUsuario
}
