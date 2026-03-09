+++
date = '2026-03-09T16:09:29+08:00'
draft = false
title = 'Learning and Practice of Single-Cell Sequencing'
+++
<div style="
  text-align: justify;    
  line-height: 1.6;       
  hyphens: auto;          
  word-break: break-all;  
  max-width: 100%;        
">


# Materials and Methods
## Learning Resources and Workflow Design

To design an appropriate analysis workflow, the overall strategy was developed based on the guidelines provided by Single Cell Best Practices [^1], with particular emphasis on rigorous data quality assessment, batch effect evaluation, and flexible downstream analysis.

<figure id="fig-sc-workflow" style="float:right; width:420px; margin-left:20px;">
  <img src="https://raw.githubusercontent.com/MikeZhangZiyi/blog/refs/heads/main/public/posts/Single%20Cell/single_cell_workflow_even_bigger.png">
  <figcaption style="color:black;">
    <strong>Figure 1. Single-cell RNA-seq analysis workflow.</strong> The adaptive strategy branches based on the presence of batch effects: scVI/scANVI for batch-aware integration and semi-supervised annotation (left branch), versus standard PCA-based analysis with CellTypist or marker-based annotation (right branch).
  </figcaption>
</figure>

At the beginning of the analysis, potential batch effects were systematically assessed using exploratory data visualization and metadata inspection. This initial evaluation determined whether samples originated from multiple batches or experimental conditions that could introduce technical variation. Based on this assessment, one of two alternative analysis workflows was selected.

When clear batch effects were detected, a latent variable-based integration strategy was adopted using scvi-tools. Specifically, scVI was first applied to learn a batch-corrected latent representation directly from raw count data. To enable reliable cell type annotation, a subset of high-confidence cells was annotated using CellTypist on a log-normalized and highly variable gene-filtered copy of the data. These high-confidence labels were then used to initialize scANVI, which performed semi-supervised learning to propagate cell type annotations across the full dataset while preserving batch correction.

In contrast, when no obvious batch effects were observed, a standard analysis pipeline was employed. This workflow included quality control, normalization, highly variable gene selection, principal component analysis (PCA), neighborhood graph construction, and clustering using the Leiden algorithm. Cell type annotation was subsequently performed using either automated prediction with CellTypist or manual validation against canonical marker genes, depending on data complexity and annotation confidence.

The overall workflow design, including both branches (with and without batch effects), is illustrated in Figure<sup>[1](#fig-sc-workflow)</sup>. This adaptive workflow design enabled the selection of the most appropriate analytical strategy according to dataset characteristics, ensuring robust batch integration, reliable cell type annotation, and analytical consistency across different single-cell datasets processed during the study.

## Immune Cell Dataset

The immune cell dataset used in this training was derived from a publicly available 10x Genomics Multiome dataset generated for a single-cell data integration challenge at the NeurIPS 2021 conference[^2]. The dataset consists of single-cell multiomic profiles from human bone marrow mononuclear cells collected from 12 healthy donors and measured at four different experimental sites, thereby introducing nested batch effects at the full dataset level.

In this study, only a single subset of the dataset—sample 4 from donor 8—was used for downstream analysis. As this subset originates from a single donor and a single experimental site, no explicit batch effects were expected within the selected data. This subset was therefore suitable for demonstrating standard scRNA-seq preprocessing and downstream analysis following best practices.

Despite the absence of apparent batch effects, two analytical strategies were applied to this dataset. First, a conventional scRNA-seq workflow based on principal component analysis (PCA) was performed to establish a baseline analysis and cell type annotation. In parallel, a latent variable–based workflow using scVI and scANVI was also applied. This additional analysis was conducted for methodological exploration and to ensure familiarity with batch-aware and semi-supervised modeling approaches, even in scenarios where batch correction is not strictly required.

By applying both workflows to the same immune cell dataset, this analysis provided a direct comparison of standard and deep learning–based approaches and served as a controlled benchmark for evaluating the behavior of scVI and scANVI under minimal batch effect conditions.

## Human Brain Infection Dataset

To further evaluate the applicability of the analysis workflow to a more complex biological context, a human brain infection–related single-cell RNA sequencing dataset was independently selected from a publicly available resource (GSE309815)[^3]. This dataset was generated using undirected human cerebral organoids derived from induced pluripotent stem cells (hiPSCs) and was designed to model neural development and host responses to viral infection in vitro.

The organoids were cultured in spinning bioreactors and divided into three experimental groups, including two infection conditions (MV1-infected and MV2-infected) and an uninfected control group (NBH). Each group was sampled at two 120 and 180 days post-infection, resulting in multiple experimental conditions across infection subtype. Single-cell RNA-seq libraries were prepared using the 10x Genomics Chromium Next GEM Single Cell 3' platform and sequenced on an Illumina NovaSeq 6000 system.

Due to the presence of multiple infection conditions, this dataset was expected to exhibit both biological variability and potential batch effects. Therefore, it provided an appropriate test case for applying batch-aware integration and semi-supervised annotation strategies. The same workflow design principles established during the immune cell analysis were applied to this dataset, including initial quality control, batch effect assessment, and the selection of either a standard PCA-based pipeline or a latent variable–based approach using scVI and scANVI.

This dataset enabled the exploration of infection-associated transcriptional changes in neural cell populations and served as a realistic and biologically meaningful example for testing the robustness and flexibility of the single-cell analysis workflow.

## Data Preprocessing and Quality Control

Quality control (QC) was performed to remove low-quality cells, technical artifacts, and ambient RNA contamination prior to downstream analysis. All QC procedures were conducted using Scanpy and related Python-based single-cell analysis tools.

### Cell-level Quality Control

Mitochondrial genes were identified based on gene names starting with the prefix “MT-”. Ribosomal genes *RPS*, *RPL* and hemoglobin genes *HB* were also annotated for diagnostic purposes. Standard per-cell QC metrics were computed, including total UMI counts, number of detected genes, and the percentage of mitochondrial gene expression. In addition, the fraction of counts contributed by the top 20 most highly expressed genes was calculated to assess transcript dominance.

QC metrics were saved prior to filtering, and their distributions were visualized using violin plots and scatter plots to facilitate inspection of data quality and threshold selection.

Low-quality cells were identified using a robust, data-driven outlier detection strategy based on the median absolute deviation (MAD). Cells were flagged as outliers if they deviated beyond five MADs from the median in any of the following log-transformed metrics: total counts, number of detected genes, or the percentage of counts in the top 20 expressed genes. This approach allows automatic identification of extreme values while remaining robust to skewed distributions.

Mitochondrial outliers were identified separately. Cells were removed if their mitochondrial gene expression exceeded either three MADs above the median or an absolute threshold of 8%, ensuring the exclusion of stressed or dying cells. Cells flagged as either general outliers or mitochondrial outliers were removed from further analysis.

Post-filtering, QC scatter plots were regenerated to confirm the effectiveness of the filtering procedure.

After cell-level filtering, raw count data were preserved in a dedicated data layer to maintain access to untransformed counts for downstream modeling and correction steps.

<figure id="fig-qc">
  <img src="https://raw.githubusercontent.com/MikeZhangZiyi/blog/refs/heads/main/content/posts/Single%20Cell/qc.png">
  <figcaption style="color:black;">
    <strong>Figure 2. Quality control of single-cell RNA-seq data. a</strong>  Violin plots showing the distributions of the number of detected genes, total UMI counts, and mitochondrial gene percentages prior to filtering. <strong>b </strong>Scatter plot of total UMI counts versus mitochondrial gene percentage before quality control. <strong>c </strong> Scatter plot of total UMI counts versus the number of detected genes before filtering. <strong>d </strong> Scatter plot of total UMI counts versus the number of detected genes after quality control.
  </figcaption>
</figure>

### Ambient RNA Correction and Gene Filtering

To account for ambient RNA contamination, SoupX was applied using raw and filtered count matrices derived from the original 10x Genomics output. A clustering-based approach was used to estimate contamination levels: cells were first normalized, log-transformed, and embedded using principal component analysis, followed by neighborhood graph construction and Leiden clustering.

Cluster assignments were supplied to SoupX to improve contamination estimation. Ambient RNA fractions were then automatically inferred, and corrected expression counts were generated. The corrected count matrix replaced the default expression matrix and was additionally stored as a separate data layer for reference.

Following ambient RNA correction, genes expressed in fewer than 20 cells were removed to eliminate low-information features. This final gene filtering step ensured that downstream analyses focused on biologically meaningful and reliably detected genes.

Overall, this multi-step QC and preprocessing strategy combined robust outlier detection, visualization-guided assessment, and ambient RNA correction to produce a high-quality single-cell dataset suitable for downstream integration, annotation, and modeling. The overall QC effect was highly satisfactory, as shown in Figure<sup>[2](#fig-qc)</sup>.

Quality control assessment revealed a high-quality single-cell RNA-seq dataset. The pre-filtering distributions of detected genes, total UMI counts, and mitochondrial gene percentages were well-concentrated with sharp, symmetric peaks and minimal low-quality tails Figure<sup>[2](#fig-qc)</sup>a, indicating low levels of ambient RNA contamination, dying cells, or empty droplets from the outset. Scatter plots further confirmed a clean linear relationship between total counts and detected genes before filtering Figure<sup>[2](#fig-qc)</sup>c, with almost no aberrant clusters of high mitochondrial content at low counts Figure<sup>[2](#fig-qc)</sup>b. After applying standard QC thresholds, the post-filtering distribution became notably tighter and more uniform Figure<sup>[2](#fig-qc)</sup>d, effectively removing the few remaining low-quality cells while preserving the vast majority of informative data. Overall, the QC results are highly satisfactory and demonstrate that the raw data were already of excellent quality, requiring only moderate filtering and setting a strong foundation for reliable downstream analyses such as integration, clustering, and cell type annotation.

## Downstream Analysis

Following quality control and preprocessing, downstream analyses were conducted within a unified computational framework. The choice of representation learning strategy was conditioned on the presence or absence of batch effects, as assessed using a combination of exploratory visualization and quantitative batch-mixing metrics. This design enabled flexible handling of technical variation while maintaining consistent biological interpretation across datasets.

###  Representation Learning Strategy Selection

Datasets were first evaluated for batch effects to guide the selection of appropriate representation learning approaches.

For datasets exhibiting minimal batch effects, raw expression counts were normalized by scaling total counts per cell to a fixed value, followed by log_1p transformation. Highly variable genes (HVGs) were identified using the Seurat v3 flavor method to prioritize biologically informative features and reduce technical noise. Principal component analysis (PCA) was then applied to the scaled, HVG-filtered expression matrix to derive a low-dimensional embedding suitable for downstream analyses.

For datasets with detectable batch effects or complex experimental designs, single-cell variational inference (scVI) was applied directly to raw count data without prior normalization, log-transformation, or highly variable gene selection. This generative modeling framework internally accounts for sequencing depth, library size, and batch-associated technical variability through its negative binomial likelihood and latent variable architecture, yielding a batch-corrected and biologically meaningful low-dimensional representation.

To support cell type annotation, a separate log-normalized data copy was prepared exclusively for automated prediction, providing high-confidence labels for subsequent semi-supervised refinement.

### Clustering and Visualization

Low-dimensional representations obtained from either PCA or the scVI latent space were used to construct a k-nearest neighbor (kNN) graph capturing cell--cell similarities. Community detection was performed using the Leiden algorithm to identify transcriptionally distinct populations. Uniform Manifold Approximation and Projection (UMAP) was applied to the same embeddings for two-dimensional visualization of cellular structure, cell type distributions, and batch mixing patterns.

### Cell Type Annotation and Semi-Supervised Learning

Cell type annotation integrated automated prediction, canonical marker gene validation, and semi-supervised learning.

For scVI-processed datasets, high-confidence labels derived from automated predictions were used to construct a supervised subset, while low-confidence cells were labeled as *unknown*. This subset was used to initialize a semi-supervised scANVI model trained on top of the scVI latent representation. scANVI propagated labels to unlabeled cells while preserving batch correction, producing refined cell type assignments across the entire dataset. Posterior probabilities were obtained for all predictions, and cells with low confidence were flagged as ambiguous to avoid over-assignment.

For PCA-processed datasets with minimal batch effects, cell type annotation relied directly on automated predictions combined with manual validation against established marker genes. Annotation consistency was assessed by examining cluster-specific marker gene expression patterns.

### Evaluation and Visualization of Results

UMAP projections were used to visualize clustering outcomes, final cell type annotations, prediction confidence scores, and batch integration quality. Annotation robustness was evaluated by comparing initial automated labels with final semi-supervised assignments and by confirming biological coherence through marker gene expression and cross-dataset consistency checks.

# Result

## Workflow Validation Using Immune Cell Data


[^1]: HEUMOS L, SCHAAR A C, LANCE C, et al. Best practices for single-cell analysis across modalities[J/OL]. Nature Reviews Genetics, 2023, 24(8): 550-572. [https://oi.org/10.1038/s41576-023-00586-w](https://oi.org/10.1038/s41576-023-00586-w). DOI: [10.1038/s41576-023-00586-w](10.1038/s41576-023-00586-w).

[^2]: LUECKENMD, BURKHARDT D B, CANNOODT R, et al. A sandbox for prediction and integration of DNA, RNA, and proteins in single cells[COL]//Thirty-fifth Conference on Neural Information Processing Systems Datasets and Benchmarks Track (Round 2). 2021. [https://openreview.net/forum?id=gN35BGa1Rt](https://openreview.net/forum?id=gN35BGa1Rt).

[^3]: Single-cell RNA-seq of human cerebral organoids under infection conditions[EB/OL]. 2024. [https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE309815](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE309815).