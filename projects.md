---
layout: page
title: Projects
---

{% for prj in site.projects %}
  <li>
    <a href="{{ prj.url }}">
      {{ prj.title }}
    </a>
  </li>
{% endfor %}