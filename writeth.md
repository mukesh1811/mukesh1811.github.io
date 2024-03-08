---
layout: page
title: Writeth
---

# my writings

{% for blog in site.writeth %}
  <li>
    <a href="{{ blog.url }}">
      {{ blog.title }}
    </a>
  </li>
{% endfor %}