<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">Json Query Language</h3>

  <p align="center">
    A simple toy language to query json files
    <br />
    <!-- <a href="https://github.com/github_username/repo_name"><strong>Explore the docs »</strong></a>
    <br /> -->
    <!-- <br />
    <a href="https://github.com/github_username/repo_name">View Demo</a>
    ·
    <a href="https://github.com/github_username/repo_name/issues">Report Bug</a>
    ·
    <a href="https://github.com/github_username/repo_name/issues">Request Feature</a> -->
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

<!-- [![Product Name Screen Shot][product-screenshot]](https://example.com) -->

A simple query language for json inspired by jsonata. This is a toy language i created for my own enjoyment and as such should not be used for anything important

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Deno][deno.land]][Deno-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

* Deno

### Compile (optional)
You can run the project directly form deno or compile it to a native executable
```sh
deno task compile
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage
### Run
Commands can be run either from deno 
```sh
deno run --allow-read .\src\query.ts {json file} {query}
```
or from compiled executable
```sh
jsonQuery {json file} {query}
```
### Example data
To follow along copy the data to a local [json file](tests/example.json)
```json
[
    {
        "name": "Bob",
        "age": 34,
        "weight": 54,
        "salary": 20000,
        "roles": [
            "chef",
            "manager"
        ],
        "children": [
            {
                "name": "Bob jr",
                "age": 6
            },
            {
                "name": "Bobina jr",
                "age": 10
            }
        ],
        "education":{
            "school": "nice school",
            "level": "phd"
        }
    },
    {
        "name": "Alice",
        "age": 25,
        "weight": 43,
        "salary": 25000,
        "roles": [
            "owner",
            "waiter"
        ],
        "children": [
            {
                "name": "Alice the small",
                "age": 3
            }
        ],
        "education":{
            "school": "even nicer school",
            "level": "candidate",
            "years": 5
        }
    }
]
```
### Queries
* Get name of all employees 
```sh
name
```
#### Result
```json
[  
    "Bob",
    "Alice"
]
```
* We can do the same with all the other fields 😊
```sh
education
```
#### Result
```json
[
    {
        "school": "nice school",
        "level": "phd"
    },
    {
        "school": "even nicer school",
        "level": "candidate",
        "years": 5
    }
]
```
* To get nested fields just add a '.'
```sh
education.school
```
#### Result
```json
[
    "nice school",
    "even nicer school"
]
```
* If we want to get all roles in a list we can use '*' to flatten a result
```sh
roles.*
```
#### Result
```json
[
    "chef",
    "manager",
    "owner",
    "waiter"
]
```
* If you prefer a string you can use the >join function
```sh
roles.*.>join
```
#### Result
```json
"chef manager owner waiter"
```
* By default join uses ' ' as a seperator if you prefer something else just pass it in
```sh
roles.*.>join(', ')
```
#### Result
```json
"chef, manager, owner, waiter"
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
    - [ ] Nested Feature

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

This is very much a toy project and as such contributions are not merged. Feel hovewer free to fork if you like me have the weird urge to experiment with toy languages 🥰.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[Deno-url]: https://deno.land/
[Deno.land]: https://img.shields.io/badge/deno%20js-000000?style=for-the-badge&logo=deno&logoColor=white