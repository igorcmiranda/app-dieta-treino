import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Criar e gerenciar customers na Iugu
export async function POST(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const { email, name, cpf_cnpj, phone } = await req.json();
    
    const response = await fetch('https://api.iugu.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        name,
        cpf_cnpj,
        phone_prefix: phone ? '55' : undefined,
        phone: phone?.replace(/\D/g, '')
      })
    });
    
    const customer = await response.json();
    
    if (!response.ok) {
      console.error('Erro ao criar customer na Iugu:', customer);
      return NextResponse.json(
        { error: customer.errors || 'Erro ao criar customer' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro no endpoint de customers:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN;
    
    if (!IUGU_API_TOKEN) {
      return NextResponse.json(
        { error: 'IUGU_API_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');
    
    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id é obrigatório' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`https://api.iugu.com/v1/customers/${customer_id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${IUGU_API_TOKEN}:`).toString('base64')}`
      }
    });
    
    const customer = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: customer.errors || 'Customer não encontrado' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro no endpoint de customers GET:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}