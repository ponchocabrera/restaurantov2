
// src/app/api/publish-menu/route.js
import { NextResponse } from 'next/server';
import { publishMenu } from '../../../controllers/menuPublisherController'; 

export async function POST(request) {
  try {
    // 1. Parse the JSON body from the request
    const body = await request.json();

    // 2. Call your controller logic
    //    which presumably returns something in the shape { success: true, generatedHTML, ... }
    const result = await publishMenu(body);

    // 3. Return the result as JSON
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
