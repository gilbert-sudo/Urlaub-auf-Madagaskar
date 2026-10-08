# Design Preference: Avoid Single Border / Outline Styles

The user has explicitly requested to NEVER use the "single border design" for UI elements in this application. 

Specifically, avoid using:
- Outline styles with a transparent or semi-transparent background and a single colored border (e.g., a thick left border).
- "Badge" styles that rely on a light tinted background with a solid left edge.

Instead, favor:
- Solid, heavy colored blocks with contrasting text (e.g., white text on a solid color).
- Distinct shape differences (such as sharp square edges vs fully rounded pill shapes) to differentiate between element types rather than outline variations.
