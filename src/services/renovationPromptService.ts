export default class PromptBuilder {
  static generateRenovationPrompt(styleChoice: string, roomType: string): string {
    const basePrompt = `HIGH-END ARCHITECTURAL INTERIOR RENDERING:

You are rendering a luxury renovation of a real interior space. **Do not alter** the original room layout, structure, window or door positions, or physical proportions in any way.

Focus only on visual upgrades such as finishes, materials, lighting, surfaces, furniture, and decorative details — while keeping the spatial layout 100% intact.`;

    const roomGuidelines = {
      kitchen: `KITCHEN RENOVATION RULES:
• Maintain all cabinet, appliance, sink, window, and door positions exactly
• Do NOT remove or reposition any structural feature
• Cabinet footprint must stay exactly the same — update door style and finish only
• Replace countertops with premium materials (butcher block, marble, or white quartz)
• Update backsplash design (herringbone tile, white subway, etc.)
• Upgrade sink fixture to a style-appropriate luxury faucet (keep sink location)
• Add dramatic focal lighting (iron pendant, farmhouse chandelier, etc.)
• Add subtle decorative accents (fruit bowl, herbs, cutting board)
• Update flooring to wide-plank hardwood or weathered farmhouse tile
• Add one hero feature: exposed wood vent hood or vintage-inspired lighting fixture`,

      bathroom: `BATHROOM RENOVATION RULES:
• Keep all plumbing and fixtures (sink, toilet, shower) in the exact same location
• Upgrade surfaces: modern tile, new vanity top, high-end mirror
• Add luxury lighting and high-end wall finishes (wainscoting, paneling, etc.)
• Use hotel-style or spa-style decor: rolled towels, plants, soaps
• No structural layout changes`,

      livingroom: `LIVING ROOM RENOVATION RULES:
• Maintain all window and door placements
• Keep fireplace and major architectural elements untouched
• Upgrade finishes, furniture, lighting, and decor in chosen style
• Add ambient and feature lighting (lamps, sconces, chandelier)
• Style with pillows, rugs, plants, and curated shelves`,

      bedroom: `BEDROOM RENOVATION RULES:
• Keep bed location, windows, and architectural layout fixed
• Upgrade finishes, bedding, lighting, and decor
• Add accent wall or ceiling detail to add richness
• Maintain current spatial layout — enhance only`,

      diningroom: `DINING ROOM RENOVATION RULES:
• Do not move doors, windows, or dining table location
• Upgrade lighting (chandeliers, sconces)
• Add texture with rugs, curtains, and wall treatments
• Style with centerpiece, plants, and art`
    };

    const styleDescriptions = {
      'farmhouse-chic': `STYLE: FARMHOUSE CHIC LUXURY
• Cabinetry: Cream, sage, or navy painted Shaker-style doors with cup pulls
• Countertops: Butcher block, marble, or white quartz with light veining
• Hardware: Aged brass, oil-rubbed bronze, or matte black
• Fixtures: Bridge faucet, apron sink, vintage-inspired lighting
• Lighting: Iron chandeliers, mason jar pendants, or barn-style sconces
• Flooring: Reclaimed wood or brick-look tile in warm tones
• Decor: Mason jars, herbs, rustic wood boards, linen curtains`,

      'modern': `STYLE: MODERN LUXURY
• Sleek lines, minimalist layout
• Flat panel cabinetry in matte or gloss finishes
• Quartz or concrete countertops
• Hidden or integrated appliances
• Neutral palette with bold accents
• Recessed lighting, sculptural pendants
• Minimal decor, emphasis on space and light`,

      'traditional': `STYLE: TRADITIONAL ELEGANCE
• Raised panel cabinetry, crown molding
• Marble or granite surfaces
• Brass or polished nickel fixtures
• Ornate lighting (crystal chandeliers, sconces)
• Classic furnishings, rugs, and framed art`,

      'coastal': `STYLE: COASTAL CALM
• Light woods, white or blue cabinetry
• Woven textures, soft natural fabrics
• Open and airy feel with ocean-inspired palette
• Nautical or beachy accessories
• Lots of natural light and plants`,

      'industrial': `STYLE: INDUSTRIAL MODERN
• Exposed brick or concrete
• Matte black hardware
• Mixed materials: metal, wood, stone
• Edison bulbs, pipe shelving
• Neutral tones with raw finishes`
    };

    const renderingStandards = `
RENDERING STANDARDS:
• Render with photorealistic lighting, natural shadows, and rich material depth
• Show premium textures (wood grain, veining, reflections, aged metal)
• Use professional-grade interior composition and perspective
• No unrealistic lighting, floating objects, or layout deviations
• Do not add or remove structural elements
• Final output must visually match top-tier architecture firm renderings
• Absolutely no text, annotations, or labeling`;

    const finalPrompt = [
      basePrompt,
      roomGuidelines[roomType as keyof typeof roomGuidelines] || '',
      styleDescriptions[styleChoice as keyof typeof styleDescriptions] || '',
      renderingStandards
    ].join('\n\n');

    return finalPrompt;
  }

  static generateCustomPrompt(userText: string): string {
    return `AI INTERIOR DESIGN TASK:
Use the uploaded image as a fixed layout reference. Keep the structure, layout, and proportions exactly as they are. Apply only the upgrades or changes requested below:

"${userText}"

RENDERING INSTRUCTIONS:
• Ultra-photorealistic rendering
• No text or labels
• No structural changes unless explicitly mentioned
• Consistent with interior architecture visualization standards`;
  }
}
