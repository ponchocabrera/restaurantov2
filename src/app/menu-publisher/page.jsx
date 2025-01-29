'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // If you're using Next.js
import { TrendyTriFoldTemplate } from './templates/TrendyTriFoldTemplate'; 
import { SinglePageTemplate } from './templates/SinglePageTemplate'; 

// [A] Example Sidebar component (normally in its own file, e.g. Sidebar.jsx)
function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 font-bold text-lg border-b border-gray-100">
        My Project
      </div>
      <nav className="flex flex-col p-2 space-y-2">
        {/* Adjust href paths to match your routes */}
        <Link href="/menu-creator">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Creator
          </span>
        </Link>
        <Link href="/restaurant-admin">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Restaurant Creator
          </span>
        </Link>
        <Link href="/my-restaurant">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            My Restaurant
          </span>
        </Link>
        <Link href="/menu-publisher">
          <span className="block px-3 py-2 rounded hover:bg-gray-100 cursor-pointer">
            Menu Publisher
          </span>
        </Link>
      </nav>
    </aside>
  );
}

// [B] Main component
export default function MenuPublisherPage() {
  // --- Your existing states and logic remain the same ---
  const [brandVoice, setBrandVoice] = useState('');
  const [style, setStyle] = useState('');
  const [tone, setTone] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  const [colorPalette, setColorPalette] = useState([]);
  const [headingFont, setHeadingFont] = useState('');
  const [bodyFont, setBodyFont] = useState('');
  const [heroPrompt, setHeroPrompt] = useState('');

  const [textureUrl1, setTextureUrl1] = useState('');
  const [textureUrl2, setTextureUrl2] = useState('');
  const [textureUrl3, setTextureUrl3] = useState('');
  const [textureLoading, setTextureLoading] = useState(false);

  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menuData, setMenuData] = useState(null);

  const [templateChoice, setTemplateChoice] = useState('trendy');

  const [logoUrl, setLogoUrl] = useState('');
  const [businessName, setBusinessName] = useState('My Trendy Restaurant');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');

  const [dishImages, setDishImages] = useState([]);

  const [professionalIndex, setProfessionalIndex] = useState(null);

  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    try {
      const res = await fetch('/api/menus');
      if (!res.ok) throw new Error('Failed to fetch menus');
      const data = await res.json();
      console.log('Fetched menus:', data);
      setMenus(data.menus || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSelectMenu(menuId) {
    setSelectedMenuId(menuId);
    if (!menuId) {
      setMenuData(null);
      return;
    }
    const basicMenu = menus.find((m) => String(m.id) === String(menuId)) || {};
    try {
      const itemsRes = await fetch(`/api/menuItems?menuId=${menuId}`);
      if (!itemsRes.ok) throw new Error('Failed to fetch items');
      const itemsData = await itemsRes.json();
      const menuItems = itemsData.menuItems || [];
      setMenuData({
        name: basicMenu.name || 'Untitled Menu',
        items: menuItems,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGenerateAIStyle() {
    try {
      const res = await fetch('/api/ai/getDesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandVoice, style, tone, extraInfo }),
      });
      if (!res.ok) throw new Error('Failed to get AI style');
      const data = await res.json();
      setColorPalette(data.design.colors || []);
      setHeadingFont(data.design.headingFont || 'Arial');
      setBodyFont(data.design.bodyFont || 'Arial');
      setHeroPrompt(data.design.heroPrompt || '');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGenerateTextures() {
    setTextureLoading(true);
    try {
      const basePrompt = `A seamless pattern, brand voice=${brandVoice}, style=${style}, tone=${tone}, additional=${extraInfo}. Variation.`;
      const res = await fetch('/api/ai/getTexture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: basePrompt, numVariations: 3 }),
      });
      if (!res.ok) throw new Error('Failed to get textures');
      const data = await res.json();
      const urls = data.urls || [];
      setTextureUrl1(urls[0] || '');
      setTextureUrl2(urls[1] || '');
      setTextureUrl3(urls[2] || '');
    } catch (err) {
      console.error(err);
    } finally {
      setTextureLoading(false);
    }
  }

  function addDishImage(url) {
    setDishImages((prev) => [...prev, url]);
  }

  async function handleRateProfessional() {
    try {
      const prompt = `
        Rate how professional these design inputs are from 1-10:
        colorPalette=${colorPalette}, headingFont=${headingFont}, bodyFont=${bodyFont}.
        Return just a single integer with no explanation.
      `;
      const res = await fetch('/api/ai/proRate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Failed rating');
      const data = await res.json();
      setProfessionalIndex(data.rating || null);
    } catch (err) {
      console.error(err);
    }
  }

  function renderTemplate() {
    if (!menuData) {
      return <p>No menu selected or no data.</p>;
    }
    const templateProps = {
      menuData,
      colorPalette,
      headingFont,
      bodyFont,
      heroPrompt,
      textureUrl1,
      textureUrl2,
      textureUrl3,
      logoUrl,
      businessName,
      tagline,
      address,
      phoneNumber,
      website,
      dishImages,
    };
    switch (templateChoice) {
      case 'single':
        return <SinglePageTemplate {...templateProps} />;
      case 'trendy':
      default:
        return <TrendyTriFoldTemplate {...templateProps} />;
    }
  }

  // [C] Wrap everything in a parent <div> with the sidebar on the left
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* [C.1] The new Sidebar on the left */}
      <Sidebar />

      {/* [C.2] The rest of your page content on the right */}
      <div className="flex flex-col flex-grow">

        {/* Optional top header if you want it above everything */}
        <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <h1 className="text-xl font-bold">Menu Publisher</h1>
        </header>

        {/* Now your existing "boxy UI" goes inside here */}
        <div className="flex-grow p-4">

          <div className="flex flex-col bg-gray-50 min-h-full">

            {/* 2-column layout as before */}
            <div className="flex">
              
              {/* LEFT column with config */}
              <div className="w-1/3 p-4 space-y-4">
                <div className="bg-white rounded-md shadow p-4 border border-gray-200 space-y-4">
                  
                  {/* AI config */}
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <h2 className="font-medium mb-2">Module AI Config</h2>
                    <div className="mb-2">
                      <label>Brand Voice:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={brandVoice}
                        onChange={(e) => setBrandVoice(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Style:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Tone:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Extra Info:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={extraInfo}
                        onChange={(e) => setExtraInfo(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateAIStyle}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Generate AI Style
                      </button>
                      <button
                        onClick={handleGenerateTextures}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        disabled={textureLoading}
                      >
                        {textureLoading ? 'Generating...' : 'Generate Textures'}
                      </button>
                    </div>
                  </div>

                  {/* Menu selection */}
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <h2 className="font-medium mb-2">Menu Selection</h2>
                    <select
                      className="border p-2 w-full rounded"
                      value={selectedMenuId || ''}
                      onChange={(e) => handleSelectMenu(e.target.value)}
                    >
                      <option value="">-- choose --</option>
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Restaurant info */}
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <h2 className="font-medium mb-2">Restaurant Info</h2>
                    <div className="mb-2">
                      <label>Logo URL:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Business Name:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Tagline:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Address:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Phone:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <label>Website:</label>
                      <input
                        className="border p-1 ml-2 rounded"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dish images */}
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <h2 className="font-medium mb-2">Dish Images</h2>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="border p-1 flex-grow rounded"
                        placeholder="Paste dish image URL"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addDishImage(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        className="bg-gray-600 text-white px-3 py-1 rounded"
                        onClick={() => {
                          const sampleUrl = 'https://picsum.photos/200/200';
                          addDishImage(sampleUrl);
                        }}
                      >
                        Add Sample
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {dishImages.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Dish"
                          className="w-24 h-24 object-cover border border-gray-300 rounded"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Template choice & rating */}
                  <div className="border border-gray-200 rounded-md p-3 bg-white">
                    <h2 className="font-medium mb-2">Other Settings</h2>
                    <p className="font-medium mb-1">Choose Template</p>
                    <label className="mr-3">
                      <input
                        type="radio"
                        name="template"
                        value="single"
                        checked={templateChoice === 'single'}
                        onChange={(e) => setTemplateChoice(e.target.value)}
                      />
                      <span className="ml-1">Single Page</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="template"
                        value="trendy"
                        checked={templateChoice === 'trendy'}
                        onChange={(e) => setTemplateChoice(e.target.value)}
                      />
                      <span className="ml-1">Trendy Tri-Fold</span>
                    </label>
                    <div className="mt-2">
                      <button
                        onClick={handleRateProfessional}
                        className="bg-pink-600 text-white px-3 py-1 rounded"
                      >
                        Rate Professional
                      </button>
                      {professionalIndex && (
                        <p className="mt-2">
                          Professional Index: {professionalIndex}/10
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT column: Preview area */}
              <div className="flex-grow p-4">
                <div className="mb-4 flex gap-2">
                  {textureUrl1 && (
                    <img
                      src={textureUrl1}
                      alt="texture1"
                      className="w-24 h-24 object-cover border border-gray-200 rounded"
                    />
                  )}
                  {textureUrl2 && (
                    <img
                      src={textureUrl2}
                      alt="texture2"
                      className="w-24 h-24 object-cover border border-gray-200 rounded"
                    />
                  )}
                  {textureUrl3 && (
                    <img
                      src={textureUrl3}
                      alt="texture3"
                      className="w-24 h-24 object-cover border border-gray-200 rounded"
                    />
                  )}
                </div>
                <div className="bg-white rounded-md shadow p-4 border border-gray-200 min-h-[400px]">
                  <h2 className="font-medium mb-2">Preview</h2>
                  {renderTemplate()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
