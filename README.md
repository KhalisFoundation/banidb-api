# BaniDB API

# Active work ongoing under dev branch

[<img height="100" src="http://www.banidb.com/wp-content/uploads/2018/03/full-banidb-logo.png">](http://banidb.com)

[![Email](https://img.shields.io/badge/Email-bod%40khalisfoundation.org-green.svg)](mailto:bod@khalisfoundation.org)
[![Slack](https://img.shields.io/badge/Slack-join%20the%20conversation-red.svg)](https://khalis.slack.com)

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/BJKALklMKao/0.jpg)](https://www.youtube.com/watch?v=BJKALklMKao)

## Contributing

### Prerequisites

1.  [Node](https://nodejs.org/en/download/) (10+)
    - `nvm` can be used for mac/linux
2.  [Docker](https://www.docker.com/get-started)

#### Optional

- [MariaDB](https://mariadb.org/download/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

### Installation

- Run `npm ci` in the repository root

### Running

- Run `npm run local` in the repository root
  - This starts the khalisfoundation/banidb-dev image in a docker container
- API will run on `http://localhost:3001/v2/`

#### Stopping

- Run `npm run docker:stop` to stop the container
- Run `npm run docker:clean` to remove the image

# Vision Statement

BaniDB's vision is to create a single, universally accessible Gurbani Database for Sikh websites and applications. BaniDB is, and will continue to be, the most accurate and complete Gurbani database ever created for use by Sikhs around the world.

In order to make this vision possible, members of this collaborative effort work to ensure that the platform is selfsustaining, tested, and secure.

BaniDB and SikhiToTheMax now power the captioning you see on live broadcasts from Sri Darbar Sahib Amritsar (Harimandir Sahib, Golden Temple).

# Precision and Recall

BaniDB is the most precise Sikh Gurbani database with over 43,000 corrections/changes (and counting!). It is simply the most accurate database in the world with Sri Guru Granth Sahib Ji data having been checked on numerous occaisions.

It is the only database in the world that is being standardized for lagamatras (spelling) and padh chhedh (word separation) versus the Shiromani Gurdwara Parbandhak Committee's (SGPC) published Gurbani pothis.

Furthermore, no change to the DB is approved without at least 3 peer reviews with full citations and audit trail. This exhaustive process ensures that no individual can tamper with Gurbani.

We have worked closely with Gursikhs and Sikh scholars around the world to build upon their previous work. These partners and collaborators include SHARE Charity UK, iGurbani, Gursevak, and others. This has allowed us to ensure we have high recall of Gurbani and Panthic sources typically sung in Kirtan or referenced in Katha.

# A Living DB

BaniDB is a collective effort up of a group of dozens of volunteers who ensure that the DB continues to grow, and is properly vetted.

# Secure

While BaniDB is a collaborative and collective effort, it is imperative that we also ensure it is an effort that secures the sanctity of Gurbani. As a result, we have chosen to take a controlled approach in order to allow for collaboration but also ensure fidelity of Gurbani data. We welcome others to get involved, but have seen too many instances of Gurbani being misused and altered to feel comfortable making the data completely open. This approach is modeled on the approach Sikhs have traditionally taken with Gurbani.

# Get Involved

Interested in coding? Have a love for Gurbani? Want to help with Marketing? Whatever your passions, we would love to work with you. Reach out to us and join our active Slack Channel today!

Found a mistake in Gurbani? Have a better translation? Become a contributor to BaniDB! Visit: https://tinyurl.com/banidb-signup for instructions.

# Feature Comparison

The table below outlines some stats about BaniDB, as of 01/14/2020.

<table cellspacing="0" cellpadding="0" id="banidbapps">
  <tr>
    <th> Source</th>
    <th> Accurate </th>
    <th> Corrections/Changes </th>
    <th> Maintained </th>
    <th> Multiple Raters per Change</th>
    <th> SGPC Compatible Lagamatras &amp; Padh Chhedh</th>
    <th> DSGMC Approval </th>
  </tr>
  <tr>
    <td> BaniDB          </td>
    <td> ✅       </td>
    <td> 43,000+     </td>
    <td> ✅         </td>
    <td> ✅                             </td>
    <td> ✅✅            </td>
    <td> ✅             </td>
  </tr>
  <tr>
    <td> SikhiToTheMax Web</td>
    <td> Uses BaniDB</td>
    <td> Uses BaniDB </td>
    <td> Uses BaniDB </td>
    <td> Uses BaniDB                 </td>
    <td> Uses BaniDB     </td>
    <td> Uses BaniDB    </td>
  </tr>
  <tr>
    <td> SikhiToTheMax 2 </td>
    <td> 80-90%   </td>
    <td> 6,000+      </td>
    <td> ❌         </td>
    <td> ❌                             </td>
    <td> ❌❌            </td>
    <td> ❌             </td>
  </tr>
  <tr>
    <td> iGurbani        </td>
    <td> 80-90%   </td>
    <td> 1,000+      </td>
    <td> ✅         </td>
    <td> ❌                             </td>
    <td> ❌❌            </td>
    <td> ❌             </td>
  </tr>
  <tr>
    <td> Sikher          </td>
    <td> ????     </td>
    <td> ????        </td>
    <td> ❌         </td>
    <td> ❌                             </td>
    <td> ❌❌            </td>
    <td> ❌             </td>
  </tr>
  <tr>
    <td> Others          </td>
    <td> ????     </td>
    <td> ????        </td>
    <td> ✅         </td>
    <td> ❌                             </td>
    <td> ✅❌            </td>
    <td> ❌             </td>
  </tr>
</table>

# Current Users

See our [Partner Page](https://www.banidb.com/partners/) for information.

# Gurbani Sources

Below is a list of sources used as ground truth for Gurbani accuracy. We have digitized sources via manual scanning, and have consolidated existing digital sources and uploaded these to www.vidhia.com to help facilitate sudhaee (correction) efforts.

## Sri Guru Granth Sahib Ji

<table cellspacing="0" cellpadding="0" id="sggs01">

  <tr>
    <th> Source </th>
    <th> Source   Type </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
  </tr>
  <tr>
    <td> Sri Guru Granth Sahib Ji Lareevar   Sarroop </td>
    <td> Primary </td>
    <td> Multiple </td>
    <td> SGPC </td>
    <td> September 2009 </td>
    <td> No Link Available </td>
  </tr>
  <tr>
    <td> Sri Guru Granth Sahib Ji </td>
    <td> Primary </td>
    <td> Multiple </td>
    <td> SGPC </td>
    <td> Unknown </td>
    <td> [<a href="https://web.archive.org/web/20180714140742/http://old.sgpc.net/files/Siri%20Guru%20Granth%20Sahib%20without%20Index%20(Uni).pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Sri Guru Granth Sahib Ji Shabadarth </td>
    <td> Primary </td>
    <td> SGPC </td>
    <td> SGPC </td>
    <td> October 2009 </td>
    <td> [<a href="http://vidhia.com/index.php?q=f&f=/Bani/Sri+Guru+Granth+Sahib+Ji+Shabadarth+(SGPC)">Link</a>]</td>
  </tr>
  <tr>
    <td> Panj Granthi </td>
    <td> Primary </td>
    <td> Multiple </td>
    <td> SGPC </td>
    <td> September 2010 </td>
    <td> [<a href="http://vidhia.com/Bani/Panj Granthi-Punjabi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Nitnem te Hor Bania(n) </td>
    <td> Primary </td>
    <td> Mulitple </td>
    <td> SGPC </td>
    <td> May 2017 </td>
    <td> [<a href="http://vidhia.com/Bani/Nitnem (SGPC).pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Santhya Sri Guru Granth Sahib Ji Volumes   1-7 </td>
    <td> Secondary </td>
    <td> Bhai Sahib Bhai Veer Singh Ji </td>
    <td> Bhai Veer Singh Sahit Sadan </td>
    <td> October 2007 </td>
    <td> [<a href="http://vidhia.com/index.php?q=f&f=/Bhai+Veer+Singh+Ji/Santhya+Sri+Guru+Granth+Sahib+Ji">Link</a>]</td>
  </tr>
  <tr>
    <td> Teeka Anek Bania(n) Volumes 1-3 </td>
    <td> Secondary </td>
    <td> Bhai Sahib Bhai Veer Singh Ji </td>
    <td> Bhai Veer Singh Sahit Sadan </td>
    <td> 4th edition, April 2008 </td>
    <td> [<a href="http://vidhia.com/Bhai Veer Singh Ji/Teeka Anek Banian (Part 1)-Bhai Vir Singh Punjabi.pdf">Volume   1</a>]   [<a href="http://vidhia.com/Bhai Veer Singh Ji/Teeka Anek Banian (Part 2)-Bhai Vir Singh Punjabi.pdf">Volume   2</a>]   [<a href="http://vidhia.com/Bhai Veer Singh Ji/Teeka Anek Banian (Part 3)-Bhai Vir Singh Punjabi.pdf">Volume   3</a>]</td>
  </tr>
  <tr>
    <td> Nitnem Steek </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td> 29th edition, April 2012</td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Nitnem Steek-Prof Sahib Singh-Punjabi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Jap Ji Sahib Steek </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td>36th edition, July 2011</td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Japji Sahib Steek-Prof Sahib Singh-Punjabi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Sukhmani Sahib Steek </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td>40th edition, February 2012</td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Sukhmani Sahib Steek-Prof Sahib Singh-Punjabi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Bhagat Bani Steek Volumes 1-5 </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td> 13th edition, July 2011 </td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Bhagat Bani Steek Part 1-Prof Sahib Singh-Punjabi.pdf">Volume   1</a>]   [<a href="http://vidhia.com/Professor Sahib Singh/Bhagat Bani Steek Part 2-Prof Sahib Singh-Punjabi.pdf">Volume   2</a>]   [<a href="http://vidhia.com/Professor Sahib Singh/Bhagat Bani Steek Part 3-Prof Sahib Singh-Punjabi.pdf">Volume   3</a>]   [<a href="http://vidhia.com/Professor Sahib Singh/Bhagat Bani Steek Part 4-Prof Sahib Singh-Punjabi.pdf">Volume   4</a>]   [<a href="http://vidhia.com/Professor Sahib Singh/Bhagat Bani Steek Part 5-Prof Sahib Singh-Punjabi.pdf">Volume   5</a>]</td>
  </tr>
  <tr>
    <td> Bhagat Bani Steek </td>
    <td> Secondary </td>
    <td> Giani Bishan Singh </td>
    <td> Bhai Partap Singh Sundar   Singh </td>
    <td> 6th edition, May 1930 </td>
    <td> [<a href="http://vidhia.com/Bhagat_Bani_Steek_1930_Gyani_Bishan_Singh_Ji(1).pdf">Link</a>]</td>
  </tr>
</table>

## Sri Dasam Granth Sahib

<table cellspacing="0" cellpadding="0" id="sri10">

  <tr>
    <th> Source </th>
    <th> Source   Type </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
  </tr>
  
  <tr>
    <td> Das Granthi </td>
    <td> Primary </td>
    <td> Guru Gobind Singh Ji </td>
    <td> SGPC </td>
    <td> March 2006 </td>
    <td> [<a href="http://vidhia.com/Bani/Das_Granthi_(SGPC).pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Sri Dasam Granth Volumes 1-2 </td>
    <td> Secondary </td>
    <td> Guru Gobind Singh Ji </td>
    <td> Chattar Singh Jeevan Singh </td>
    <td> Unknown </td>
    <td> No Link Available </td>
  </tr>
  <tr>
    <td> Akal Ustat </td>
    <td> Primary </td>
    <td> Guru Gobind Singh Ji </td>
    <td> SGPC </td>
    <td> 5th edition, December 1995 </td>
    <td> [<a href="http://vidhia.com/Bani/Akal%20Ustat-Punjabi.PDF">Link</a>]</td>
  </tr>
  <tr>
    <td> Bachitar Natak </td>
    <td> Primary </td>
    <td> Guru Gobind Singh Ji </td>
    <td> SGPC </td>
    <td> 7th edition, July 2000 </td>
    <td> [<a href="http://vidhia.com/Bani/Bachitar%20Natak-Punjabi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Nitnem te Hor Bania(n) </td>
    <td> Primary </td>
    <td> Mulitple </td>
    <td> SGPC </td>
    <td> May 2017 </td>
    <td> [<a href="http://vidhia.com/Bani/Nitnem%20%28SGPC%29.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Nitnem, Das Granthi, ate Hor Bania(n) </td>
    <td> Secondary </td>
    <td> Multiple </td>
    <td> Hazoori Taksaal </td>
    <td>2006</td>
    <td> [<a href="http://vidhia.com/Bani/Das_Granthi_Pothi.pdf">Link</a>]</td>
  </tr>
  <tr>
    <td> Sri Dasam Granth Sahib Steek Volumes   1-2 </td>
    <td> Secondary </td>
    <td> Giani Bishan Singh Ji </td>
    <td> Khalsa College Amritsar </td>
    <td>1941</td>
    <td> [<a href="http://vidhia.com/Bani/Sri Dasam Granth Sahib Teeka Part 1 - Giani Bishan Singh Ji.pdf">Volume   1</a>]   [<a href="http://vidhia.com/Bani/Sri Dasam Granth Sahib Teeka Part 2 - Giani Bishan Singh Ji.pdf">Volume   2</a>] </td>
  </tr>
  <tr>
    <td> Chandi Di Vaar Steek </td>
    <td> Secondary </td>
    <td> Pandit Narain Singh </td>
    <td> Bh. Jvahar Singh, Kirpal Singh   &amp; Co </td>
    <td> 20th century </td>
    <td> [<a href="http://vidhia.com/Bani/Chandi_Di_Vaar_Steek_-_Pandit_Narain_Singh_Ji.pdf">Link</a>] </td>
  </tr>
  <tr>
    <td> Nitnem Steek </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td> 29th edition, April 2012</td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Nitnem Steek-Prof Sahib Singh-Punjabi.pdf">Link</a>] </td>
  </tr>
  <tr>
    <td> Jaap Sahib Steek </td>
    <td> Secondary </td>
    <td> Professor Sahib Singh </td>
    <td> Singh Brothers </td>
    <td>17th edition, August 2003</td>
    <td> [<a href="http://vidhia.com/Professor Sahib Singh/Jaap Sahib Steek-Prof Sahib Singh-Punjabi.pdf">Link</a>] </td>
  </tr>
</table>

## Bhai Gurdaas Ji

<table cellspacing="0" cellpadding="0" id="bhaigurdas">
  <tr>
    <th> Source </th>
    <th> Source   Type </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
  </tr>
  <tr>
    <td> Vaaran Bhai Gurdaas Ji </td>
    <td> Primary </td>
    <td> Bhai Gurdaas Ji </td>
    <td> SGPC </td>
    <td> November 2011 </td>
    <td> [<a href="https://vidhia.com/Bhai Gurdaas Ji/Vaaran Bhai Gurdaas Ji - SGPC.pdf">Link</a>] </td>
  </tr>
  <tr>
    <td> Vaaran Bhai Gurdaas Ji </td>
    <td> Secondary </td>
    <td> Giani Hazara Singh Ji Pandit &amp;   Bhai Sahib Bhai Veer Singh Ji </td>
    <td> Bhai Veer Singh Sahit Sadan </td>
    <td> 21st edition, June 2001 </td>
    <td> [<a href="http://vidhia.com/Bhai Veer Singh Ji/Vaaran Bhai Gurudas Ji-Bhai Vir Singh Punjabi.pdf">Link</a>] </td>
  </tr>
  <tr>
    <td>Vaaran Bhai Gurdaas Ji Steek </td>
    <td> Secondary </td>
    <td> Giani Harbans Singh </td>
    <td> Khalsa Sahit Sadan </td>
    <td> December 2004 </td>
    <td> [<a href="http://vidhia.com/Giani Harbans Singh/Varaan-Bhai-Gurdasji-Steek-By-Giani-Harbans-Singh.pdf">Link</a>] </td>
  </tr>
</table>

## Bhai Nand Lal Ji

<table cellspacing="0" cellpadding="0" id="bhainandlal">
  <tr>
    <th> Source </th>
    <th> Source   Type </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
  </tr>
   <tr>
    <td> Bhai Nand Lal Granthavali </td>
    <td> Primary </td>
    <td> Dr. Ganda Singh </td>
    <td> Punjabi University Patiala </td>
    <td> 2009 </td>
    <td> [<a href="http://sikhbookclub.com/Book/Bhai-Nand-Lal-Granthavali">Link</a>] </td>
  </tr>
  <tr>
    <td> Ganj Namah Steek </td>
    <td> Secondary </td>
    <td> Bhai Veer Singh Ji </td>
    <td> Bhai Veer Singh Sahit Sadan </td>
    <td> 2012 </td>
    <td> [<a href="http://vidhia.com/Bhai%20Veer%20Singh%20Ji/Ganj%20Namah%20Steek-Bhai%20Vir%20Singh%20Punjabi.pdf">Link</a>] </td>
  </tr>
 
</table>

## Sarabloh Granth, Amrit Keertan, and Rehatname

<table cellspacing="0" cellpadding="0" id="sarabloh">
  <tr>
    <th> Source </th>
    <th> Source   Type </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
    <th></th>
  </tr>

  <tr>
    <td> Sri Sarabloh Granth Sahib Ji   Sampooran Steek Volumes 1-2 </td>
    <td> Primary </td>
    <td> Santa Singh </td>
    <td> Buddha Dal </td>
    <td> June 2000 </td>
    <td colspan="2"> [<a href="http://vidhia.com/Bani/Complete-Sri-Sarbloh-Granth-Sahib-Ji-Steek.pdf">Link</a>] </td>
  </tr>
  <tr>
    <td> Amrit Keertan </td>
    <td> Primary </td>
    <td> Multiple </td>
    <td> Khalsa Brothers </td>
    <td> 40th edition,  July 2011 </td>
    <td colspan="2"> [<a href="http://vidhia.com/Bani/Amrit Keertan (Khalsa Brothers).pdf">Link</a>] </td>
  </tr>
</table>

# Translation Sources

Below is a list of sources used for translations. We have digitized sources via manual scanning and have consolidated existing digital sources.

<table cellspacing="0" cellpadding="0" id="sggs01">

  <tr>
    <th> Source </th>
    <th> Author </th>
    <th> Publisher </th>
    <th> Edition </th>
    <th> Link </th>
  </tr>
  <tr>
    <td> BaniDB </td>
    <td> BaniDB Volunteers and Partners </td>
    <td> KhalisFoundation </td>
    <td> Living </td>
    <td> http://www.sikhitothemax.org </td>
  </tr>
  <tr>
    <td> Fareedkot Teeka </td>
    <td> Sant Giani Badan Singh Ji of Dera Sekhwan et al.</td>
    <td> Wazir Hind Press </td>
    <td> 1928 </td>
    <td> No link available </td>
  </tr>
  <tr>
    <td> Bhai Manmohan Singh </td>
    <td> Bhai Manmohan Singh </td>
    <td> SGPC </td>
    <td> c1948 </td>
    <td> No link available </td>
  </tr>
  <tr>
    <td> Sikhnet </td>
    <td> Bhai Ji Singh Sahib Babaji Singh Khalsa </td>
    <td> Sikhnet </td>
    <td> October 2008 </td>
    <td> https://www.sikhnet.com/news/siri-guru-granth-sahib-spanish </td>
  </tr>
  <tr>
    <td> Sri Guru Granth Sahib Darpan </td>
    <td> Professor Sahib Singh </td>
    <td> SGPC </td>
    <td> c1965 </td>
    <td> No link available </td>
  </tr>
  <tr>
    <td> Dr. Sant Singh Khalsa </td>
    <td> Dr. Sant Singh Khalsa </td>
    <td> Sikhnet </td>
    <td> 2 </td>
    <td> https://www.sikhnet.com/siri-guru-granth-sahib-w-english-translation </td>
  </tr>

</table>

# Metrics

<table cellspacing="0" cellpadding="0" id="changes">

  <tr>
    <th> Date       </th>
    <th> Verified Changes  </th>
  </tr>
  <tr>
    <td> 04/13/2024 </td>
    <td align="right">46,810</td>
  </tr>
  <tr>
    <td> 11/18/2020 </td>
    <td align="right">43,649</td>
  </tr>
  <tr>
    <td> 01/14/2020 </td>
    <td align="right">43,042</td>
  </tr>
  <tr>
    <td> 01/07/2020 </td>
    <td align="right">42,540</td>
  </tr>
  <tr>
    <td> 01/05/2020 </td>
    <td align="right">42,005</td>
  </tr>
  <tr>
    <td> 11/06/2019 </td>
    <td align="right">41,544</td>
  </tr>
  <tr>
    <td> 05/26/2019 </td>
    <td align="right">41,250</td>
  </tr>
  <tr>
    <td> 05/25/2019 </td>
    <td align="right">41,000</td>
  </tr>
  <tr>
    <td> 04/20/2019 </td>
    <td align="right">40,750</td>
  </tr>
  <tr>
    <td> 03/05/2019 </td>
    <td align="right">40,500</td>
  </tr>
  <tr>
    <td> 02/19/2019 </td>
    <td align="right">40,250</td>
  </tr>
  <tr>
    <td> 02/18/2019 </td>
    <td align="right">40,000</td>
  </tr>
  <tr>
    <td> 02/05/2019 </td>
    <td align="right">39,750</td>
  </tr>
  <tr>
    <td> 02/01/2019 </td>
    <td align="right">39,500</td>
  </tr>
  <tr>
    <td> 01/25/2019 </td>
    <td align="right">39,000</td>
  </tr>
  <tr>
    <td> 01/01/2019 </td>
    <td align="right">37,792</td>
  </tr>
  <tr>
    <td> 07/01/2018 </td>
    <td align="right">35,674</td>
  </tr>
  <tr>
    <td> 01/01/2018 </td>
    <td align="right">7,937</td>
  </tr>
</table>
