const pool = require('../conexao')
const jwt = require('jsonwebtoken')
const senhaJwt = require('../senhaJwt')

const listarTransacaoUsuario = async (req, res) => {
    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        const { rows } = await pool.query('select * from transacoes')

        return res.status(200).json(rows)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }

}

const detalharTransacao = async (req, res) => {
    const { authorization } = req.headers
    const { id } = req.params

    try {
        const token = authorization.split(' ')[1]

        const query = `
      select id, tipo, descricao as categoria_nome, valor, data, usuario_id, categoria_id 
      from transacoes where id = $1 and usuario_id = $2
      `

        const { rows, rowCount } = await pool.query(query, [id, req.usuario.id])

        if (rowCount === 0) {
            return res.status(404).json({ mensagem: 'Transação não encontrada' })
        }

        return res.status(200).json(rows[0])

    } catch (error) {

        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }

}

const cadastrarTransacao = async (req, res) => {
    const { authorization } = req.headers
    const { descricao, valor, data, categoria_id, tipo } = req.body

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
    }

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        const categoriaExiste = await pool.query('select * from categorias where id = $1', [categoria_id])

        if (categoriaExiste.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Categoria não encontrada' })
        }

        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(404).json({ mensagem: 'Campo tipo deve receber somente valores: entrada ou saida' })
        }

        const query = `insert into transacoes (descricao, valor, data, categoria_id, usuario_id, tipo)
        values($1, $2, $3, $4, $5, $6) returning *
        `

        const { rows } = await pool.query(query, [descricao, valor, data, categoria_id, id, tipo])

        return res.status(201).json(rows)

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }

}

const atualizarTransacao = async (req, res) => {
    const { authorization } = req.headers
    const { descricao, valor, data, categoria_id, tipo } = req.body
    const { id } = req.params


    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
    }

    try {
        const token = authorization.split(' ')[1]

        const existeTransacao = await pool.query('select * from transacoes where id = $1 and usuario_id = $2',
            [id, req.usuario.id])

        if (existeTransacao.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Transação não encontrada' })
        }

        const categoriaExiste = await pool.query('select * from categorias where id = $1', [categoria_id])

        if (categoriaExiste.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Categoria não encontrada' })
        }

        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(400).json({ mensagem: 'Campo tipo deve receber somente valores: entrada ou saida' })
        }

        const queryAtualizarTransacao =
            `update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 
            where id = $6 and usuario_id = $7`

        await pool.query(queryAtualizarTransacao, [descricao, valor, data, categoria_id, tipo, id, req.usuario.id])

        return res.status(204).send()

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

const excluirTransacao = async (req, res) => {
    const { authorization } = req.headers
    const { id } = req.params

    try {
        const token = authorization.split(' ')[1]
        const { id: usuario_id } = jwt.verify(token, senhaJwt)

        const existeTransacao = await pool.query('select * from transacoes where id = $1 and usuario_id = $2',
            [id, usuario_id])

        if (existeTransacao.rowCount === 0) {
            return res.status(404).json({ mensagem: 'Transação não encontrada' })
        }

        await pool.query('delete from transacoes where id = $1', [id])

        return res.status(204).send()

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

const obterExtrato = async (req, res) => {
    const { authorization } = req.headers

    try {
        const token = authorization.split(' ')[1]
        const { id } = jwt.verify(token, senhaJwt)

        const existeTransacao = await pool.query('select * from transacoes where usuario_id = $1', [id])

        if (existeTransacao.rowCount < 1) {
            return res.status(404).json({ mensagem: 'Não há transações cadastradas para esse usuário' })
        }

        const query = `
        select 
            sum(case when tipo = 'entrada' then valor else 0 end) as total_entrada,
            sum(case when tipo = 'saida' then valor else 0 end) as total_saida
        from transacoes 
        where usuario_id = $1  
        `

        const { rows } = await pool.query(query, [id])

        return res.status(200).json({
            total_entrada: rows[0].total_entrada,
            total_saida: rows[0].total_saida
        });

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro inesperado' })
    }
}

module.exports = {
    listarTransacaoUsuario,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    excluirTransacao,
    obterExtrato
}