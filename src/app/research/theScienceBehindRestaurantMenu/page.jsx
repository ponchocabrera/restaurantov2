"use client";

import React from "react";
import Image from "next/image";
import DashboardLayout from "@/components/shared/DashboardLayout";

export default function Research() {
  return (
    <DashboardLayout>
      <main className="min-h-screen bg-gray-50 p-8">
        {/* Hero Section */}
        <section className="bg-white py-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">
              The Science Behind Restaurant Menu Design
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              A comprehensive look into the psychology, design principles, and best practices that influence how diners interact with your menu.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            {/* Introduction */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <p className="text-gray-700 mb-4">
                Menus are more than just a list of dishes and prices; they are a powerful tool that can significantly influence customer choices and, ultimately, a restaurant's success<sup>1</sup>. Understanding the science behind menu design can help restaurant owners create menus that are both visually appealing and strategically effective in driving sales and enhancing the dining experience. This report delves deep into the psychology and best practices of menu design, providing a comprehensive framework for building a menu that caters to your specific restaurant type and target audience.
              </p>
              {/* Placeholder Image */}
              <div className="w-full h-64 relative mb-4">
                <Image
                  src="/images/menu-design-hero.jpg"
                  alt="Restaurant Menu Design"
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-md"
                />
              </div>
            </article>

            {/* Research Methodology */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Research Methodology</h2>
              <p className="text-gray-700 mb-4">
                Before diving into the intricacies of menu design, it's important to understand how the information presented in this report was gathered. Focus group interviews played a crucial role in the research process<sup>3</sup>. These interviews involved small groups of individuals who provided valuable insights into their preferences, behaviors, and decision-making processes when interacting with restaurant menus. By gathering diverse perspectives and firsthand accounts, the research team was able to identify key trends and patterns that inform the recommendations presented in this report.
              </p>
            </article>

            {/* Menu Psychology */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">
                Menu Psychology: Understanding Customer Behavior
              </h2>
              <p className="text-gray-700 mb-4">
                Research has shown that diners typically spend less than two minutes reading a menu<sup>4</sup>, so making a strong first impression and guiding their attention effectively is essential. Here are some key psychological principles to consider:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>
                  <strong>Cognitive Biases</strong>: <em>Paradox of Choice</em> and <em>Serial Position Effect</em> can be used to avoid overwhelming customers and to highlight high-profit or signature dishes.
                </li>
                <li>
                  <strong>Emotional Responses</strong>: Using nostalgia, appealing visuals, or evocative language can trigger positive emotions through the <em>affect heuristic</em>.
                </li>
                <li>
                  <strong>Social Influences</strong>: Leveraging the <em>Reciprocity Rule</em> with complimentary items can enhance loyalty.
                </li>
                <li>
                  <strong>Motivational Factors</strong>: Techniques like <em>Loss Aversion</em> and <em>Sunk-Cost Bias</em> can drive customer decisions by emphasizing urgency or encouraging repeat visits.
                </li>
              </ul>
            </article>

            {/* Menu Engineering */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Engineering</h2>
              <p className="text-gray-700 mb-4">
                Menu engineering is the process of analyzing the profitability and popularity of menu items to maximize revenue. Items are generally categorized into:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li><strong>Stars</strong>: High-profit, high-popularity.</li>
                <li><strong>Plowhorses</strong>: Low-profit, high-popularity.</li>
                <li><strong>Puzzles</strong>: High-profit, low-popularity.</li>
                <li><strong>Dogs</strong>: Low-profit, low-popularity.</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Techniques like loss-leader pricing and the decoy effect can also be employed to influence customer perception and choice<sup>8,9</sup>. Regularly analyzing sales data and customer feedback ensures your menu remains profitable and relevant.
              </p>
            </article>

            {/* Menu Design Best Practices */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Design Best Practices</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Know Your Audience:</strong> Tailor your menu to the preferences and demographics of your target market<sup>10</sup>.
                </p>
                <p>
                  <strong>Organize and Structure:</strong> Use clear headings, sections, and spacing to simplify navigation<sup>11</sup>.
                </p>
                <p>
                  <strong>Typography &amp; Color Schemes:</strong> Choose fonts that reflect your brand and color palettes that evoke the right emotions<sup>12</sup>.
                </p>
                <p>
                  <strong>Imagery &amp; White Space:</strong> Use high-quality images sparingly to enhance appeal, and ensure ample white space to avoid clutter<sup>5</sup>.
                </p>
                <p>
                  <strong>Menu Ergonomics &amp; Variability:</strong> Keep physical menus easy to handle and balanced in their selection of dishes<sup>8</sup>.
                </p>
                <p>
                  <strong>Brand Storytelling:</strong> Share your restaurant's values, history, and unique selling points to create emotional connections<sup>13</sup>.
                </p>
              </div>
            </article>

            {/* Menu Design for Different Restaurant Types */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Design for Different Restaurant Types</h2>
              <p className="text-gray-700 mb-4">
                Every restaurant type has unique requirements. For fast-food, emphasize clarity, concise descriptions, and combo deals. Casual dining often uses warmth and inviting imagery, whereas fine dining prioritizes elegance and sophistication<sup>4,18</sup>. Consider mobile-responsive designs to accommodate online ordering and delivery preferences.
              </p>
            </article>

            {/* Optimal Menu Length and Number of Pages */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Optimal Menu Length and Number of Pages</h2>
              <p className="text-gray-700 mb-4">
                Limiting choices can improve customer satisfaction. Aim for around seven items per category<sup>5</sup>, and consider using two-page menus for easy navigation<sup>19</sup>. For more extensive offerings, separate menus by meal period or category (e.g., desserts, drinks) to avoid overwhelming diners.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Menu Size</th>
                      <th className="p-2 border">Dimensions</th>
                      <th className="p-2 border">Description</th>
                      <th className="p-2 border">Ideal For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border">Lunch Menu</td>
                      <td className="p-2 border">8.5" x 11"</td>
                      <td className="p-2 border">Standard letter size</td>
                      <td className="p-2 border">Casual dining, quick-service restaurants</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Dinner Menu</td>
                      <td className="p-2 border">8.5" x 14" or 11" x 17"</td>
                      <td className="p-2 border">Larger format, more variety</td>
                      <td className="p-2 border">Fine dining, diverse offerings</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">Drink/Dessert Menu</td>
                      <td className="p-2 border">4.25" x 11" or 5.5" x 8.5"</td>
                      <td className="p-2 border">Compact, focused</td>
                      <td className="p-2 border">Bars, cafes, specialized selections</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            {/* Menu Layout and Organization */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Layout and Organization</h2>
              <p className="text-gray-700 mb-4">
                Strategically placing items can significantly influence choices. The <em>Golden Triangle</em> theory suggests diners look first to the middle, then top-right, then top-left<sup>6</sup>. Use visual cues like boxes, colors, or images (<em>eye magnets</em>) to draw attention to high-margin items<sup>20</sup>. Group similar dishes together and leverage primacy and recency effects by placing important items at the beginning and end of each section.
              </p>
            </article>

            {/* Menu Descriptions and Pricing */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Descriptions and Pricing</h2>
              <h3 className="text-xl font-semibold mb-2">Descriptions</h3>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>
                  <strong>Entice &amp; Inform</strong>: Use sensory words (e.g., "crispy," "zesty") to paint a vivid picture<sup>1</sup>.
                </li>
                <li>
                  <strong>Keep It Concise</strong>: Aim for brief, clear descriptions<sup>1</sup>.
                </li>
                <li>
                  <strong>Highlight Key Features</strong>: Emphasize unique ingredients or culinary techniques<sup>7</sup>.
                </li>
              </ul>
              <h3 className="text-xl font-semibold mb-2">Pricing</h3>
              <ul className="list-disc ml-6 text-gray-700">
                <li>
                  <strong>Food Costs</strong>: Calculate cost of goods sold (COGS) for each dish to ensure profitability<sup>15</sup>.
                </li>
                <li>
                  <strong>Pricing Psychology</strong>: Remove dollar signs or use charm pricing (e.g., 9.99 vs. 10.00) to influence perception<sup>5</sup>.
                </li>
                <li>
                  <strong>Decoy Effect</strong>: Place a high-priced item next to a slightly cheaper option to make the latter more appealing<sup>9</sup>.
                </li>
              </ul>
            </article>

            {/* Menu Framework and Recommendations */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Menu Framework and Recommendations</h2>
              <ol className="list-decimal ml-6 space-y-2 text-gray-700">
                <li>
                  <strong>Define Your Restaurant's Identity</strong>: Determine your cuisine, target audience, and pricing strategy<sup>15</sup>.
                </li>
                <li>
                  <strong>Plan Your Menu Content</strong>: Organize dishes into logical categories, balancing variety with focus<sup>23</sup>.
                </li>
                <li>
                  <strong>Calculate Food Costs &amp; Set Prices</strong>: Ensure profitability by analyzing costs and local market expectations<sup>23</sup>.
                </li>
                <li>
                  <strong>Craft Compelling Descriptions</strong>: Write brief, sensory-rich descriptions that highlight key features<sup>23</sup>.
                </li>
                <li>
                  <strong>Design the Layout</strong>: Use the Golden Triangle and visual cues (boxes, bold text) to guide attention<sup>16</sup>.
                </li>
                <li>
                  <strong>Select Typography &amp; Colors</strong>: Reflect your brand identity and consider the psychological impact of colors<sup>16</sup>.
                </li>
                <li>
                  <strong>Incorporate Images Strategically</strong>: High-quality photos should be used sparingly to avoid clutter<sup>23</sup>.
                </li>
                <li>
                  <strong>Proofread &amp; Test</strong>: Gather feedback from staff and customers before finalizing<sup>15</sup>.
                </li>
              </ol>
            </article>

            {/* Conclusion */}
            <article className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
              <p className="text-gray-700 mb-4">
                Restaurant menu design is more than just an aesthetic choice—it's a strategic tool that combines psychology, marketing, and culinary art. By understanding customer behavior, employing effective layout strategies, crafting enticing descriptions, and setting prices intelligently, restaurant owners can boost both customer satisfaction and profitability. Continual analysis and adjustments will ensure the menu remains fresh, relevant, and aligned with your restaurant's overarching brand and vision<sup>15</sup>.
              </p>
            </article>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
