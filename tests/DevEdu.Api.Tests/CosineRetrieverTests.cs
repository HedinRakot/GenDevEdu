using DevEdu.Api.Models;
using DevEdu.Api.Services.Chat;
using Xunit;

namespace DevEdu.Api.Tests;

public class CosineRetrieverTests
{
    private static CourseEmbedding Doc(string id, params double[] v) =>
        new() { Id = id, Vector = v };

    [Fact]
    public void Cosine_IdenticalDirection_Is1_OppositeIsNegative()
    {
        Assert.Equal(1.0, CosineRetriever.Cosine(new[] { 1.0, 0 }, new[] { 2.0, 0 }), 6);
        Assert.Equal(0.0, CosineRetriever.Cosine(new[] { 1.0, 0 }, new[] { 0, 1.0 }), 6);
        Assert.True(CosineRetriever.Cosine(new[] { 1.0, 0 }, new[] { -1.0, 0 }) < 0);
    }

    [Fact]
    public void Cosine_MismatchedOrEmpty_IsZero()
    {
        Assert.Equal(0.0, CosineRetriever.Cosine(new[] { 1.0 }, new[] { 1.0, 2.0 }));
        Assert.Equal(0.0, CosineRetriever.Cosine(System.Array.Empty<double>(), new[] { 1.0 }));
    }

    [Fact]
    public void TopK_RanksByCosineAndLimits()
    {
        var docs = new[]
        {
            Doc("near", 1.0, 0.1),   // fast gleiche Richtung wie Query
            Doc("orth", 0.0, 1.0),   // orthogonal
            Doc("far", -1.0, 0.0),   // entgegengesetzt
        };

        var top = CosineRetriever.TopK(new[] { 1.0, 0.0 }, docs, 2);

        Assert.Equal(2, top.Count);
        Assert.Equal("near", top[0].Doc.Id);
        Assert.True(top[0].Score > top[1].Score);
    }
}
